import React, { useState, useRef, useEffect, useCallback } from 'react';
import ContextMenu from './ContextMenu';

const Cell = ({
  value,
  displayValue,
  onChange,
  onSelect,
  onMouseDown,
  onMouseMove,
  isSelected,
  name,
  styles = {},
  onDragStart,
  onDragEnd,
  onFillDragStart,
  onFillDragMove,
  onFillDragEnd,
  onAddRow,
  onDeleteRow,
  onAddColumn,
  onDeleteColumn
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFillDragging, setIsFillDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const cellRef = useRef(null);
  const fillHandleRef = useRef(null);

  // Add keyboard event listener for the document
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if focus is on an input, select, or textarea element
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'SELECT' || 
          e.target.tagName === 'TEXTAREA' ||
          e.target.closest('.toolbar') ||
          e.target.closest('.formula-bar')) {
        return;
      }

      // Only handle keypress if this cell is primary selected and not already editing
      if (isSelected?.includes('primary') && !isEditing) {
        // If it's a printable character or special keys like backspace/delete
        if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
          setIsEditing(true);
          // If it's a printable character, we want to start with that character
          if (e.key.length === 1) {
            onChange(e.key);
          } else {
            // For backspace/delete, we want to start with empty value
            onChange('');
          }
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, onChange]);

  useEffect(() => {
    if (isSelected && isEditing && cellRef.current) {
      cellRef.current.focus();
    }
  }, [isSelected, isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleCellMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left click only
      onSelect(e);
      if (!isEditing) {
        setIsDragging(true);
        onDragStart?.(name);
      }
    }
  }, [isEditing, name, onSelect, onDragStart]);

  const handleCellMouseMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      onMouseMove?.(name);
    } else if (isFillDragging) {
      e.preventDefault();
      onFillDragMove?.(e);
    }
  }, [isDragging, isFillDragging, name, onMouseMove, onFillDragMove]);

  const handleCellMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
    if (isFillDragging) {
      setIsFillDragging(false);
      onFillDragEnd?.();
    }
  }, [isDragging, isFillDragging, onDragEnd, onFillDragEnd]);

  const handleFillHandleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFillDragging(true);
    onFillDragStart?.(name);
  }, [name, onFillDragStart]);

  useEffect(() => {
    if (isDragging || isFillDragging) {
      document.addEventListener('mousemove', handleCellMouseMove);
      document.addEventListener('mouseup', handleCellMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleCellMouseMove);
        document.removeEventListener('mouseup', handleCellMouseUp);
      };
    }
  }, [isDragging, isFillDragging, handleCellMouseMove, handleCellMouseUp]);

  const cellStyle = {
    fontWeight: styles.fontWeight || 'normal',
    fontStyle: styles.fontStyle || 'normal',
    fontSize: styles.fontSize || '14px',
    color: styles.color || '#000000',
    fontFamily: styles.fontFamily || 'Arial',
    textDecoration: styles.textDecoration || 'none',
    textAlign: styles.textAlign || 'left',
    position: 'relative'
  };

  return (
    <td
      ref={cellRef}
      className={`cell border border-gray-300 px-2 py-1 ${isSelected} ${isDragging ? 'cell-dragging' : ''}`}
      style={cellStyle}
      data-cell-name={name}
      onMouseDown={handleCellMouseDown}
      onMouseMove={handleCellMouseMove}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      draggable={false}
    >
      {isEditing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full outline-none"
          style={{ textAlign: styles.textAlign || 'left' }}
          autoFocus
        />
      ) : (
        <div className="w-full h-full min-h-[20px]" style={{ textAlign: styles.textAlign || 'left' }}>
          {displayValue}
        </div>
      )}
      {isSelected?.includes('primary') && !isEditing && (
        <>
          <div 
            ref={fillHandleRef}
            className="fill-handle"
            onMouseDown={handleFillHandleMouseDown}
          />
          {isFillDragging && (
            <div 
              className="autofill-cover"
              style={{
                top: fillHandleRef.current?.offsetTop || 0,
                left: fillHandleRef.current?.offsetLeft || 0
              }}
            />
          )}
        </>
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAddRow={onAddRow}
          onDeleteRow={onDeleteRow}
          onAddColumn={onAddColumn}
          onDeleteColumn={onDeleteColumn}
        />
      )}
    </td>
  );
};

export default Cell; 