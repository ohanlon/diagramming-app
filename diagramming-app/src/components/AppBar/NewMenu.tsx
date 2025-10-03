import React, { useState } from 'react';
import { MenuItem, ListItemIcon, ListItemText, Button, Menu, Tooltip } from '@mui/material';
import { ArticleOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDiagramStore } from '../../store/useDiagramStore';

export const NewMenuItem: React.FC<{ onNew: () => void }> = ({ onNew }) => {
  return (
    <MenuItem onClick={() => { onNew(); }}>
      <ListItemIcon><ArticleOutlined fontSize="small" /></ListItemIcon>
      <ListItemText sx={{ minWidth: '100px', paddingRight: '16px' }}>New Diagram</ListItemText>
    </MenuItem>
  );
};

export const NewButton: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const createNewDiagram = useDiagramStore(state => state.createNewDiagram);
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNew = () => {
    // Create and open new diagram
    try {
      createNewDiagram();
      navigate('/diagram');
    } catch (e) {
      console.error('Failed to create new diagram', e);
    } finally {
      handleClose();
    }
  };

  return (
    <>
      <Tooltip title="Create a new blank diagram">
        <span>
          <Button aria-label="New diagram" variant="contained" size="small" onClick={handleClick}>New</Button>
        </span>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleNew}><ListItemText>New Diagram</ListItemText></MenuItem>
      </Menu>
    </>
  );
};

export default NewButton;
