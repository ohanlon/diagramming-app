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
  const createAndSaveNewDiagram = useDiagramStore(state => (state as any).createAndSaveNewDiagram as (name?: string) => Promise<string | null>);
  const navigate = useNavigate();

  const handleNew = () => {
    (async () => {
      try {
        const id = await createAndSaveNewDiagram();
        if (id) {
          navigate(`/diagram/${id}`);
        } else {
          // Fallback: navigate to diagram route (MainAppLayout will redirect to dashboard when no id)
          navigate('/diagram');
        }
      } catch (e) {
        console.error('Failed to create and save new diagram', e);
        navigate('/diagram');
      }
    })();
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
