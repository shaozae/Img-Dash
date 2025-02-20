import os
import json
import asyncio
from aiohttp import ClientSession
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient, UpdateOne
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
from bson import json_util, ObjectId
from google.cloud import compute_v1
from google.protobuf import json_format
from azure.identity import ClientSecretCredential
from azure.mgmt.compute import ComputeManagementClient
import boto3

load_dotenv()

# Load user configuration
with open('config.json') as config_file:
    config = json.load(config_file)

# Initialize the Flask app
app = Flask(__name__,)
CORS(app, expose_headers=['X-Total-Count'])

# MongoDB configuration
uri = os.getenv('MONGO_URI')
db_name = os.getenv('MONGO_DB_NAME')
list_collection_name = os.getenv('MONGO_COLLECTION_NAME')
context_collection_name = os.getenv('MONGO_CONTEXT_COLLECTION_NAME')

client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
collection = db[list_collection_name]
context_collection = db[context_collection_name]

def parse_json(data):
    return json.loads(json_util.dumps(data))

async def fetch_aws_data():
    aws_regions = config['aws']['regions']
    current_image_ids = set()
    bulk_operations = []

    for region in aws_regions:
        ec2 = boto3.client('ec2', 
            region_name=region,
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        response = ec2.describe_images(Owners=['self'])
        instances_response = ec2.describe_instances(Filters=[{'Name': 'instance-state-name', 'Values': ['running', 'stopped']}])
        running_instances = []
        for reservation in instances_response['Reservations']:
            for instance in reservation['Instances']:
                instance_name = None
                if 'Tags' in instance:
                    for tag in instance['Tags']:
                        if tag['Key'] == 'Name':
                            instance_name = tag['Value']
                            break
                running_instances.append({
                    'machine_id': instance['InstanceId'],
                    'machine_name': instance_name,
                    'image_id': instance['ImageId'],
                    'state': instance['State']['Name']
                })
        for image in response['Images']:
            current_image_ids.add(image.get('ImageId'))
            in_use_by = [inst for inst in running_instances if inst['image_id'] == image.get('ImageId')]
            data = {
                'id': image.get('ImageId'),
                'name': image.get('Name'),
                'description': image.get('Description'),
                'date_created': image.get('CreationDate'),
                'cloud_platform': 'AWS',
                'image_data': image,
                'in_use_by': in_use_by if in_use_by else None,
                'status': 'active'
            }
            bulk_operations.append(
                UpdateOne(
                    {'id': data['id']},
                    {'$set': data},
                    upsert=True
                )
            )
    if bulk_operations:
        collection.bulk_write(bulk_operations)
    existing_images = collection.find({'cloud_platform': 'AWS'})
    bulk_operations = []
    for existing_image in existing_images:
        if existing_image['id'] not in current_image_ids:
            bulk_operations.append(
                UpdateOne(
                    {'id': existing_image['id']},
                    {'$set': {'status': 'deleted'}}
                )
            )
    if bulk_operations:
        collection.bulk_write(bulk_operations)

async def fetch_azure_data():
    tenant_id = os.getenv('AZURE_TENANT_ID')
    client_id = os.getenv('AZURE_CLIENT_ID')
    client_secret = os.getenv('AZURE_CLIENT_SECRET')
    subscription_id = os.getenv('AZURE_SUBSCRIPTION_ID')
    credential = ClientSecretCredential(tenant_id, client_id, client_secret)
    compute_client = ComputeManagementClient(credential, subscription_id)
    vm_image_data = []
    try:
        custom_images = compute_client.images.list()
        for custom_image in custom_images:
            custom_image_dict = custom_image.as_dict()
            vm_image_data.append(custom_image_dict)
    except Exception as e:
        print(f"Error fetching custom images: {e}")
    running_and_stopped_vms = []
    for vm in compute_client.virtual_machines.list_all():
        resource_group_name = vm.id.split('/')[4]
        instance_view = compute_client.virtual_machines.instance_view(resource_group_name, vm.name)
        for status in instance_view.statuses:
            if status.code in ['PowerState/running', 'PowerState/deallocated']:
                running_and_stopped_vms.append({
                    'machine_name': vm.name,
                    'machine_id': vm.id,
                    'image_id': vm.storage_profile.image_reference.id,
                    'state': status.display_status
                })
                break
    current_image_ids = set()
    bulk_operations = []
    for image in vm_image_data:
        current_image_ids.add(image['id'])
        in_use_by = [vm for vm in running_and_stopped_vms if vm['image_id'] == image['id']]
        normalized_data = {
            'id': image['id'],
            'name': image['name'],
            'description': image.get('description'),
            'date_created': image.get('time_created'),
            'cloud_platform': 'Azure',
            'image_data': image,
            'in_use_by': in_use_by if in_use_by else None,
            'status': 'active'
        }
        bulk_operations.append(
            UpdateOne(
                {'id': normalized_data['id']},
                {'$set': normalized_data},
                upsert=True
            )
        )
    if bulk_operations:
        collection.bulk_write(bulk_operations)
    existing_images = collection.find({'cloud_platform': 'Azure'})
    bulk_operations = []
    for existing_image in existing_images:
        if existing_image['id'] not in current_image_ids:
            bulk_operations.append(
                UpdateOne(
                    {'id': existing_image['id']},
                    {'$set': {'status': 'deleted'}}
                )
            )
    if bulk_operations:
        collection.bulk_write(bulk_operations)

async def fetch_gcp_data():
    project_id = os.getenv("PROJECT_ID")
    key_file_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not project_id or not key_file_path:
        print("Google Cloud credentials are not set in the environment variables.")
        return
    client = compute_v1.ImagesClient()
    vm_image_data = []
    for image in client.list(project=project_id):
        image_info = json_format.MessageToDict(image._pb)
        vm_image_data.append(image_info)
    client = compute_v1.InstancesClient()
    instances = []
    for zone, instances_scoped_list in client.aggregated_list(project=project_id):
        if instances_scoped_list.instances:
            for instance in instances_scoped_list.instances:
                if instance.status in ['RUNNING', 'TERMINATED']:
                    instance_info = json_format.MessageToDict(instance._pb)
                    instances.append(instance_info)
    current_image_ids = set()
    bulk_operations = []
    for image in vm_image_data:
        image_id = extract_id_from_uri(image['selfLink'])
        current_image_ids.add(image_id)
        in_use_by = []
        for inst in instances:
            try:
                disk_name = extract_id_from_uri(inst['disks'][0]['source'])
                zone = inst['zone'].split('/')[-1]
                disk_details = get_disk_details(project_id, zone, disk_name)
                source_image = disk_details.get('sourceImage')
                source_image_id = extract_id_from_uri(source_image) if source_image else None
                if source_image_id == image_id:
                    in_use_by.append({
                        'machine_name': inst['name'],
                        'machine_id': inst['id'],
                        'image_id': source_image_id,
                        'state': inst['status']
                    })
            except KeyError as e:
                print(f"KeyError: {e} in instance {inst['name']}")
        normalized_data = {
            'id': image.get('id'),
            'name': image.get('name'),
            'description': image.get('description'),
            'date_created': image.get('creationTimestamp'),
            'cloud_platform': 'GCP',
            'image_data': image,
            'in_use_by': in_use_by if in_use_by else None,
            'status': 'active'
        }
        bulk_operations.append(
            UpdateOne(
                {'id': normalized_data['id']},
                {'$set': normalized_data},
                upsert=True
            )
        )
    if bulk_operations:
        collection.bulk_write(bulk_operations)
    existing_images = collection.find({'cloud_platform': 'GCP'})
    bulk_operations = []
    for existing_image in existing_images:
        if existing_image['id'] not in current_image_ids:
            bulk_operations.append(
                UpdateOne(
                    {'id': existing_image['id']},
                    {'$set': {'status': 'deleted'}}
                )
            )
    if bulk_operations:
        collection.bulk_write(bulk_operations)

def extract_id_from_uri(uri):
    """Extracts the ID from a GCP resource URI."""
    return uri.split('/')[-1]

def get_disk_details(project_id, zone, disk_name):
    """Gets the details of a specific disk."""
    client = compute_v1.DisksClient()
    disk = client.get(project=project_id, zone=zone, disk=disk_name)
    return json_format.MessageToDict(disk._pb)

@app.before_request
def log_request_info():
    print(f"Headers: {request.headers}")
    print(f"Body: {request.get_data()}")

@app.route('/api/fetch_data', methods=['GET'])
async def fetch_data():
    try:
        tasks = []
        if config['enabled_cloud_platforms'].get('aws'):
            tasks.append(fetch_aws_data())
        if config['enabled_cloud_platforms'].get('azure'):
            tasks.append(fetch_azure_data())
        if config['enabled_cloud_platforms'].get('gcp'):
            tasks.append(fetch_gcp_data())
        await asyncio.gather(*tasks)
        return jsonify({'message': 'Data fetched successfully'}), 200
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/images', methods=['GET'])
def get_images():
    try:
        # Extract pagination parameters
        start = request.args.get('_start', default=0, type=int)
        end = request.args.get('_end', default=9, type=int)
        
        # Extract sorting parameters
        sort_field = request.args.get('_sort', default='id')
        sort_order = request.args.get('_order', default='asc')
        
        # Determine sort direction
        sort_direction = 1 if sort_order == 'asc' else -1

        # Extract filter parameters
        query = {}
        name_like = request.args.get('name_like')
        if name_like:
            query['$or'] = [
                {'name': {'$regex': name_like, '$options': 'i'}},
                {'id': {'$regex': name_like, '$options': 'i'}}
            ]
            
        # Fetch data from the list collection
        list_data = collection.find(query).skip(start).limit(end - start).sort(sort_field, sort_direction)

        # Convert cursor to list and parse JSON
        combined_data = [parse_json(doc) for doc in list_data]

        # Return the combined data and total count
        total_count = collection.count_documents(query)
        response = jsonify(combined_data)
        response.headers['X-Total-Count'] = total_count
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to fetch a single AMI by ID
@app.route('/api/details/<string:object_id>', methods=['GET'])
def get_image(object_id):
    try:
        print(f"Fetching image with ID: {object_id}")  # Log the ami_id
        image = collection.find_one({"_id": ObjectId(object_id)})  # Find the AMI by its _id
        if image:
            return jsonify(parse_json(image))  # Return the AMI data if found
        else:
            return jsonify({"error": "image not found"}), 404
    except Exception as e:
        print(f"Error fetching image data: {e}")
        return jsonify({'error': str(e)}), 500

# New route to add a new document to context_collection and relate it with the parent document using object_id
@app.route('/api/context', methods=['POST'])
def add_context():
    try:
        new_data = request.get_json()
        if not new_data:
            return jsonify({'error': 'No data provided'}), 400
        
        if 'parent_id' in new_data:
            new_data['parent_id'] = ObjectId(new_data['parent_id'])

        # Insert the new document into the context_collection
        context_collection.insert_one(new_data)

        return jsonify({'message': 'Document added successfully'}), 200
    except Exception as e:
        print(f"Error adding document: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/context/<string:object_id>', methods=['GET'])
def get_context_data(object_id):
    try:
        parent_document = collection.find_one({"_id": ObjectId(object_id)})
        if not parent_document:
            return jsonify({'error': 'Parent document not found'}), 404

        # Fetch all documents from context_collection that match the parent document's object_id
        context_data = context_collection.find({"parent_id": ObjectId(object_id)})
        context_data_list = [parse_json(doc) for doc in context_data]

        return jsonify(context_data_list), 200
    except Exception as e:
        print(f"Error fetching context data: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/context/<string:object_id>', methods=['DELETE'])
def delete_context(object_id):
    try:
        result = context_collection.delete_one({"_id": ObjectId(object_id)})
        if result.deleted_count == 1:
            return jsonify({'message': 'Document deleted successfully'}), 200
        else:
            return jsonify({'error': 'Document not found'}), 404
    except Exception as e:
        print(f"Error deleting document: {e}")
        return jsonify({'error': str(e)}), 500


# New route to fetch a single context document by its _id
@app.route('/api/context/document/<string:object_id>', methods=['GET'])
def get_context_document(object_id):
    try:
        context_document = context_collection.find_one({"_id": ObjectId(object_id)})
        if context_document:
            return jsonify(parse_json(context_document)), 200
        else:
            return jsonify({'error': 'Document not found'}), 404
    except Exception as e:
        print(f"Error fetching context document: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    from waitress import serve
    port = int(os.getenv('BACKEND_PORT', 5000))  # Default to port 5000 if BACKEND_PORT is not set
    serve(app, host="0.0.0.0", port=port)

