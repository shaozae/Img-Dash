import React from "react";
import { DataGrid, GridActionsCellItem, type GridColDef, GridColumnVisibilityModel } from "@mui/x-data-grid";
import { List, useDataGrid, } from "@refinedev/mui";
import { useApiUrl, useCustom } from "@refinedev/core";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom"; 
import type { Images } from "../../../interfaces"; 
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress"; // Import CircularProgress for loading indicator


export const ImageList: React.FC = () => {
  
  const { dataGridProps, search, } = useDataGrid<Images>({
    onSearch: (Images) => [
      {
        field: "name",
        operator: "contains",
        value: (Images as Images).name,
      },
    ],
    resource: "images",
  });

  const { tableQuery } = useDataGrid();
  const { refetch } = tableQuery;

  const navigate = useNavigate(); // Initialize useNavigate
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState<GridColumnVisibilityModel>({
    architecture: false,
  });

  const apiUrl = useApiUrl(); // Get the base URL from the dataProvider

  const [loading, setLoading] = React.useState(false); // State to manage loading indicator

  const { refetch: fetchData } = useCustom({
    url: `${apiUrl}/fetch_data`, // Use the dataProvider URL
    method: "get",
  });

  const handleRefresh = async () => {
    setLoading(true); // Set loading to true when fetching data
    try {
      await fetchData();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // Set loading to false when data is fetched or if there is an error
      refetch(); // Refetch the dataGrid
    }
  };

  const columns = React.useMemo<GridColDef<Images>[]>(
    () => [
      {
        field: "id",
        headerName: "Image ID",
        minWidth: 200,
        flex: 0.5,
        renderCell: (params) => {
          return (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/details/${params.row._id.$oid}`);
              }}
              style={{ textDecoration: "underline", color: "blue" }}
            >
              {params.value}
            </a>
          );
        },
      },
      { field: "name", headerName: "Name", minWidth: 200, flex: 1,  },
      
      {
        field: "date_created",
        headerName: "Creation Date",
        minWidth: 200,
        flex: 0.5,
        renderCell: (params) => {
          if (!params.value) {
            return "N/A";
          }
          return format(new Date(params.value), "PP p");
        },
      },
      { field: "description", headerName: "Description", minWidth: 300, flex: 1,   },
      { field: "status", headerName: "Status", minWidth: 100, flex: 0.4,   },
      { field: "cloud_platform", headerName: "Platform", minWidth: 100, flex: 0.3,  },
      {
        field: "in_use_by",
        headerName: "In Use",
        type: "boolean",
        minWidth: 100,
        flex: 0.3,
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        sortable: false,
        headerAlign: "center",
        align: "center",
        disableColumnMenu: true,
        getActions: ({ row }) => [
          <GridActionsCellItem
            key={2}
            sx={{ padding: "12px 16px" }}
            showInMenu
            label="Details"
            onClick={() => navigate(`/details/${row._id.$oid}`)}
          />,
          <GridActionsCellItem
            key={3}
            sx={{ padding: "12px 16px" }}
            showInMenu
            label="Context"
            onClick={() => navigate(`/attach/${row._id.$oid}`)}
          />,
        ],
      },
    ],
    [navigate]
  );

  return (
    <List title="VM Images" wrapperProps={{ sx: { boxShadow: 'none' } }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', gap: 2 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as typeof e.target & {
                name: { value: string };
              };
              search({ name: target.name.value });
            }}
            style={{ display: 'flex', width: '100%' }}
          >
            <TextField
              label="Search by Name or ID"
              name="name"
              variant="outlined"
              type="search"
              fullWidth
              InputProps={{
                style: { borderRadius: '20px' },
              }}
            />
            <Button type="submit" sx={{ ml: 2, borderRadius: '20px' }}>
              Search
            </Button>
          </form>
        </Box>
        <Button onClick={handleRefresh} sx={{ borderRadius: '20px' }} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Refresh"}
        </Button>
      </Box>
      <DataGrid
        {...dataGridProps}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
        disableColumnFilter={true}
        pagination
        paginationMode="server"
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        sx={{
          boxShadow: 3, // Add shadow to the table
          border: 1,
          borderRadius: 3,
          borderColor: 'grey.300',
          '& .MuiDataGrid-cell:hover': {
            color: 'primary.main',
          },
          '& .MuiDataGrid-columnHeader[data-field="actions"]': {
            backgroundColor: 'primary.main',
            color: 'white',
          },
        }}
      />
    </List>
  );
};

