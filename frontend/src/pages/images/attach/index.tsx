import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { IconButton, Menu, MenuItem, Button, Typography, Grid, Card, CardContent, TextField } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContextBook from '../../../components/contextBook';
import { useCreate } from '@refinedev/core'; 

export const AttachPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState(''); // State for title
  const [selectedOption, setSelectedOption] = useState('');
  const [titleError, setTitleError] = useState(false); // State for title error
  const { id } = useParams<{ id: string }>(); // object ID of current image
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { mutate: createContext } = useCreate(); // Use the useCreate hook

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (e.target.value.trim()) {
      setTitleError(false); // Clear error if title is not empty
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError(true); // Set error if title is empty
      return;
    }

    if (!code.trim()) return;

    const jsonPayload = {
      code: code,
      user: "John Doe", // Replace with actual user if needed
      from: selectedOption || null, // Allow 'from' to be null
      date: new Date().toISOString(), // Current date in ISO format
      title: title, // Include title in JSON payload
      parent_id: id, // Use ObjectId for parent_id
    };

    createContext(
      {
        resource: "context",
        values: jsonPayload,
      },
      {
        onSuccess: () => {
          alert('Code saved successfully!');
          setCode('');
          setTitle(''); // Clear title input
          setSelectedOption('');
        },
        onError: (error) => {
          console.error('Error saving code:', error);
          alert('An error occurred while saving the code.');
        },
      }
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Add Context</h1>
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuClose}>Webhook API</MenuItem>
          <MenuItem onClick={() => handleMenuClick(`/details/${id}`)}>Details</MenuItem>
        </Menu>
      </div>
      <div className="flex justify-evenly ml-[-100px] mt-4">
        <div className="block" style={{ width: '80%' }}>
          <TextField
            label="Title"
            value={title}
            onChange={handleTitleChange}
            fullWidth
            margin="normal"
            variant="outlined"
            error={titleError} // Show error state
            helperText={titleError ? "Title is required" : ""} // Show helper text if error
            sx={{ width: '100%' }} // Make the TextField wider
          />
          <TextField
            label="Context"
            value={code}
            onChange={handleCodeChange}
            multiline
            rows={20}
            fullWidth
            margin="normal"
            variant="outlined"
            placeholder="Type your Context here..."
            sx={{ width: '100%' }} // Make the TextField wider
          />
          <br />
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: '#4dabf5', color: 'white', '&:hover': { backgroundColor: '#2196f3' } }}
            className="mt-4"
          >
            Save
          </Button>
        </div>
      </div>

      <Grid item xs={12} sm={8}>
        <Card sx={{ boxShadow: 'none', borderRadius: '16px', padding: '20px', marginTop: '20px' }}>
          <CardContent sx={{ height: 450 }}>
            <Typography variant="h6">Context Book</Typography>
            <ContextBook />
          </CardContent>
        </Card>
      </Grid>
    </div>
  );
};

export default AttachPage;


