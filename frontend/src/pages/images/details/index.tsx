/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOne } from "@refinedev/core";
import { Card, CardContent, Typography, Grid, Box, IconButton, Menu, MenuItem, List, ListItem, ListItemText } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { Images, ImageData } from "../../../interfaces"; // Adjust the import path as needed
import { format } from 'date-fns';
import ContextBook from "../../../components/contextBook";

// dynamic card subcomponent to handle any JSON structure
const MultiPlatformCard: React.FC<{ data: Record<string, any>; title?: string }> = ({
  data,
  title = "Multi-Platform Data",
}) => {
  return (
    <Card sx={{ boxShadow: "none"}}>
      <CardContent sx={{ padding: "25px" }}>
        <Grid container spacing={2}>
          {Object.entries(data).map(([key, value]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card variant="outlined" sx={{ border: "1px solid #ccc", boxShadow: "none", borderRadius: "16px", marginTop: "20px" }}>
                <CardContent>
                  <Typography variant="h6">
                    {key}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {typeof value === "object" && value !== null
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export const ImageDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useOne<Images>({ resource: "details", id });
  const [showAlert, setShowAlert] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

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

  const handleTimelineItemClick = (object_Id: string) => {
    navigate(`/details/${object_Id}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Image not found</div>;
  }

  const image = data.data;

  const formattedDate = image.date_created
    ? format(new Date(image.date_created), "MMMM dd, yyyy, hh:mm a")
    : "N/A";


  return (
    <div >
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
            <div style={{ flex: 1,}}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
                  {image.name}
                </Typography>
                  {Array.isArray(image.image_data.Tags) && image.image_data.Tags?.map((tag, index) => (
                    <div style={{ display: 'flex', alignItems: 'flex-end', border: '1px solid #ccc', borderRadius: '16px', marginLeft: '20px', paddingRight: '6px' }}>
                    <Typography key={index} variant="body2" sx={{ ml: 1, alignSelf: 'flex-end' }}>
                      {tag.Key}: {tag.Value}
                    </Typography>
                    </div>
                  ))}
              </div>
            </div>
          <Typography variant="body2" sx={{ textAlign: 'left', color: 'text.secondary', marginLeft: '20px' }}>
              created: {formattedDate}
            </Typography>
            
          </div>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleMenuClick(`/attach/${image._id.$oid}`)}>Attach</MenuItem>
          </Menu>
        </Grid>

        <Grid item xs={12} sx={{ marginLeft: '20px' }}>
          <Typography variant="h6">In Use By</Typography>
          {image.in_use_by ? (
            <Grid container spacing={2}>
              {image.in_use_by.map((use) => (
                <Grid item xs={12} sm={6} md={4} key={use.machine_id}>
                    <Card sx={{ boxShadow: "none" }}>
                    <CardContent>
                      <Typography variant="body2">
                        Machine ID: {use.machine_id}
                      </Typography>
                      <Typography variant="body2">
                        Image ID: {use.image_id}
                      </Typography>
                      <Typography variant="body2">
                        State: {use.state}
                        <br />
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No usage information available.
            </Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <MultiPlatformCard
            data={image.image_data || {}}
            title="Platform-Specific Details"
          />
        </Grid>

         
        <Grid item xs={12} sm={12}>
          <Card sx={{ border: '1px solid #ccc', boxShadow: 'none', borderRadius: '16px', padding: '20px' }}>
            <CardContent sx={{ height: 450 }}>
              <Typography variant="h6">Context Book</Typography>
              <ContextBook />
            </CardContent>
          </Card>
        </Grid>
        
        
        {/* Add other fields as needed */}
      </Grid>
    </div>
  );
};

export default ImageDetails;
