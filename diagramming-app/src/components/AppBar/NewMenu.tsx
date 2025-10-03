import React from 'react';
import { MenuItem, ListItemIcon, ListItemText, Fab, Tooltip } from '@mui/material';
import { ArticleOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
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
  const createNewDiagram = useDiagramStore(state => state.createNewDiagram);
  const navigate = useNavigate();

  const handleNew = () => {
    try {
      createNewDiagram();
      navigate('/diagram');
    } catch (e) {
      console.error('Failed to create new diagram', e);
    }
  };

  return (
    <Tooltip title="Create a new blank diagram">
      <span>
        <Fab aria-label="New diagram" color="primary" size="small" onClick={handleNew}>
          <AddIcon />
        </Fab>
      </span>
    </Tooltip>
  );
};

export default NewButton;
