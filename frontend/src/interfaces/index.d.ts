
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

export interface Images {
  id: string;
  date_created: string;
  description: string | null;
  name: string;
  in_use: boolean;
  cloud_platform: string;
  _id: {
    $oid: string;
  }
  image_data: ImageData;
  in_use_by: InUseBy[];
  status: string;
}

interface ImageData {
  id: string;
  architecture: string;
  creation_date: string;
  description: string | null;
  name: string;
  state: string;
  in_use: boolean;
  root_device_type: string;
  root_device_name: string;
  platform: string;
  image_type: string;
  image_owner_alias: string;
  hypervisor: string;
  virtualization_type: string;
  owner_id: string;
  deprecation_time: string;
  tags: { [key: string]: string };
  Tags: { [key: string]: string };
  block_device_mappings: BlockDeviceMapping[]
  total: number;
}

interface InUseBy {
  image_id: string;
  machine_id: string;
  machine_name: string;
  state: string;
}

interface BlockDeviceMapping {
  DeviceName: string;
  Ebs?: Ebs;
  VirtualName?: string;
}

interface Ebs {
  DeleteOnTermination: boolean;
  Encrypted: boolean;
  Iops: number;
  SnapshotId: string;
  Throughput: number;
  VolumeSize: number;
  VolumeType: string;
}


export interface IContext {
  title: any;
  _id: {
    $oid: string;
  }
  parent_id: {
    $oid: string;
  }
  code: string;
  user: string;
  from: string | null;
  date: string; // Use string to represent date in ISO format
}