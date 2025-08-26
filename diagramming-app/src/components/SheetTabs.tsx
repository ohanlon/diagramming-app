import React, { useState, useRef, useEffect } from 'react';
import { useDiagramStore } from '../store/useDiagramStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import './SheetTabs.less';
import { Tooltip } from 'react-tooltip';

interface SheetTabsProps {
  // No props needed as it will interact directly with the store
}

const SheetTabs: React.FC<SheetTabsProps> = () => {
  const { sheets, activeSheetId, addSheet, removeSheet, setActiveSheet, renameSheet } = useDiagramStore();
  const sheetIds = Object.keys(sheets);

  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editedSheetName, setEditedSheetName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const handleAddSheet = () => {
    addSheet();
  };

  const handleRemoveSheet = (id: string) => {
    if (sheetIds.length > 1) {
      removeSheet(id);
    } else {
      alert('Cannot remove the last sheet.');
    }
  };

  const handleRenameSheet = (id: string, currentName: string) => {
    setEditingSheetId(id);
    setEditedSheetName(currentName);
  };

  const saveEditedName = (id: string) => {
    if (editedSheetName.trim() !== '' && editedSheetName !== sheets[id]?.name) {
      renameSheet(id, editedSheetName.trim());
    }
    setEditingSheetId(null);
    setEditedSheetName('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      saveEditedName(id);
    } else if (e.key === 'Escape') {
      setEditingSheetId(null);
      setEditedSheetName('');
    }
  };

  useEffect(() => {
    if (editingSheetId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingSheetId]);

  const checkScrollButtons = () => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useEffect(() => {
    const currentTabsRef = tabsRef.current;
    if (currentTabsRef) {
      currentTabsRef.addEventListener('scroll', checkScrollButtons);
      // Initial check
      checkScrollButtons();
    }

    // Re-check when sheets change (add/remove/rename)
    // Use a timeout to ensure DOM has updated after sheet changes
    const timeoutId = setTimeout(checkScrollButtons, 0);

    return () => {
      if (currentTabsRef) {
        currentTabsRef.removeEventListener('scroll', checkScrollButtons);
      }
      clearTimeout(timeoutId);
    };
  }, [sheetIds, sheets]); // Depend on sheetIds and sheets to re-check on changes

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = tabsRef.current.clientWidth * 0.5; // Scroll half the visible width
      if (direction === 'left') {
        tabsRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="sheet-tabs-container">
      <Tooltip id="diagram-status-tooltip" data-tooltip-float="true" />

      {showLeftScroll && (
        <button className="scroll-button left" onClick={() => scrollTabs('left')}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}
      <div ref={tabsRef} className="sheet-tabs">
        {sheetIds.map((id) => {
          const sheet = sheets[id];
          if (!sheet) return null;
          const isEditing = editingSheetId === sheet.id;

          return (
            <div
              key={sheet.id}
              className={`sheet-tab ${sheet.id === activeSheetId ? 'active' : ''}`}
              onClick={() => setActiveSheet(sheet.id)}
              onDoubleClick={() => handleRenameSheet(sheet.id, sheet.name)}
            >
              {isEditing ? (
                <span className='sheet-name-container'>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedSheetName}
                    onChange={(e) => setEditedSheetName(e.target.value)}
                    onBlur={() => saveEditedName(sheet.id)}
                    onKeyDown={(e) => handleInputKeyDown(e, sheet.id)}
                  />
                </span>
              ) : (
                <span className='sheet-name-container'>
                  <span className='sheet-name'>{sheet.name}</span>
                </span>
              )}
              <button
                className="remove-sheet-button"
                disabled={sheetIds.length === 1}
                data-tooltip-id="diagram-status-tooltip" data-tooltip-content="Remove Sheet"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSheet(sheet.id);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          );
        })}
      </div>
      {showRightScroll && (
        <div className="bordered-tool-group">
          <button className="scroll-button right" onClick={() => scrollTabs('right')}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
      <div className="bordered-tool-group">
        <button onClick={handleAddSheet} className="add-sheet-button" data-tooltip-id="diagram-status-tooltip" data-tooltip-content="Add New Sheet">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );
};

export default SheetTabs;