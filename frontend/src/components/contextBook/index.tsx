// ContextBook.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOne, useDelete } from '@refinedev/core';
import { IContext } from '../../interfaces';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CardContent, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format } from 'date-fns';

const ContextBook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useOne<IContext>({ resource: "context", id });
  const { mutate: deleteContext } = useDelete();
  const [menuState, setMenuState] = useState<{ anchorEl: HTMLElement | null, rowId: string | null }>({ anchorEl: null, rowId: null });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data</div>;
  }

  if (!data) {
    return <div>Context Book not found</div>;
  }

  const context = Array.isArray(data.data) ? data.data : [];

  const handleDelete = (id: string) => {
    deleteContext(
      {
        resource: "context",
        id,
      },
      {
        onSuccess: () => {
          alert('Context deleted successfully!');
          // Optionally, you can refetch the data or update the state to remove the deleted row
        },
        onError: (error) => {
          console.error('Error deleting context:', error);
          alert('An error occurred while deleting the context.');
        },
      }
    );
  };

  const handleView = (row: IContext) => {
    const jsonData = JSON.stringify(row, null, 2);
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>JSON Data - ${row.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
              }
              .date {
                font-size: 14px;
                color: gray;
              }
              .user {
                font-size: 18px;
              }
              pre {
                background-color: #f4f4f4;
                padding: 20px;
                border-radius: 8px;
                overflow-x: auto;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${row.title}</div>
              <div class="date">${format(new Date(row.date), 'MMM dd, yyyy h:mm a')}</div>
            </div>
            <div class="user">Added by: ${row.user}</div>
            <pre>${row.code}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date Added',
      flex: 1,
      minWidth: 200,
      disableColumnMenu: true,
      valueFormatter: ({ value }) => {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString(); // Check if date is valid
      },
    },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 300, disableColumnMenu: true },
    { field: 'user', headerName: 'Added By', flex: 1, minWidth: 300, disableColumnMenu: true },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      maxWidth: 100,
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: true,
      renderCell: (params) => (
        <>
          <IconButton
            aria-label="more"
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={(event) => setMenuState({ anchorEl: event.currentTarget, rowId: params.row._id.$oid })}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            id="long-menu"
            anchorEl={menuState.anchorEl}
            keepMounted
            open={menuState.rowId === params.row._id.$oid}
            onClose={() => setMenuState({ anchorEl: null, rowId: null })}
          >
            <MenuItem
              onClick={() => {
                handleView(params.row);
                setMenuState({ anchorEl: null, rowId: null });
              }}
            >
              View
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDelete(params.row._id.$oid);
                setMenuState({ anchorEl: null, rowId: null });
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </>
      ),
    },
  ];

  return (
    <CardContent sx={{ height: 400 }}>
      <DataGrid
        sx={{ mt: 2, paddingLeft: '20px' }}
        rows={context}
        columns={columns}
        getRowId={(row) => row._id.$oid}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5 },
          },
        }}
        pageSizeOptions={[5]}
        onRowClick={(params) => {
          console.log('Row clicked:', params.row);
        }}
      />
    </CardContent>
  );
};

export default ContextBook;