import { useState, useEffect, useRef } from 'react';
import {
  getFolderTree,
  getFolder,
  createFolder,
  deleteFolder,
  createNote,
  updateNote,
  deleteNote,
  uploadFile,
  downloadFile,
  deleteFile,
  Folder,
  Note,
  File,
  FolderTree,
} from '../api/files';
import './FileExplorer.css';

interface BreadcrumbItem {
  id: number | null;
  name: string;
}

// Function to render text with clickable links
function renderTextWithLinks(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="note-link"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

interface EditingNote {
  id: number;
  content: string;
  folderId: number | null;
}

export function FileExplorer() {
  const [tree, setTree] = useState<FolderTree | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'Home' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Note input
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingNote, setEditingNote] = useState<EditingNote | null>(null);

  // File upload
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Folder modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadTree = async () => {
    try {
      setLoading(true);
      const data = await getFolderTree();
      setTree(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadFolder = async (folderId: number) => {
    try {
      setLoading(true);
      const data = await getFolder(folderId);
      setCurrentFolder(data.folder);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    // Scroll to bottom when notes change
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentFolder?.notes, tree?.notes]);

  const navigateToFolder = async (folder: Folder) => {
    await loadFolder(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = async (index: number) => {
    const item = breadcrumbs[index];
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);

    if (item.id === null) {
      setCurrentFolder(null);
      await loadTree();
    } else {
      await loadFolder(item.id);
    }
  };

  const goBack = async () => {
    if (breadcrumbs.length > 1) {
      await navigateToBreadcrumb(breadcrumbs.length - 2);
    }
  };

  const getCurrentFolderId = (): number | undefined => {
    return currentFolder?.id;
  };

  const getCurrentItems = () => {
    if (currentFolder) {
      return {
        folders: currentFolder.folders || [],
        notes: currentFolder.notes || [],
        files: currentFolder.files || [],
      };
    }
    return {
      folders: tree?.folders || [],
      notes: tree?.notes || [],
      files: tree?.files || [],
    };
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setIsSubmitting(true);
    try {
      await createFolder(newFolderName, getCurrentFolderId());
      setNewFolderName('');
      setShowNewFolderModal(false);
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      await createNote(newNoteContent, getCurrentFolderId());
      setNewNoteContent('');
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setIsSubmitting(false);
      // Keep focus on the textarea after everything is done
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendNote();
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNote({ id: note.id, content: note.note, folderId: note.folder_id });
  };

  const handleSaveEdit = async () => {
    if (!editingNote || !editingNote.content.trim()) return;

    try {
      await updateNote(editingNote.id, editingNote.content, editingNote.folderId);
      setEditingNote(null);
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      await uploadFile(selectedFile, getCurrentFolderId());
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      handleUploadFile();
    }
  }, [selectedFile]);

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) {
      return;
    }

    try {
      await deleteFolder(id);
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const handleDownloadFile = async (file: File) => {
    try {
      const blob = await downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDeleteFile = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await deleteFile(id);
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteNote(id);
      await refreshCurrentView();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  const refreshCurrentView = async () => {
    if (currentFolder) {
      await loadFolder(currentFolder.id);
    } else {
      await loadTree();
    }
  };

  const { folders, notes, files } = getCurrentItems();

  // Combine notes and files, sort by created_at
  type MessageItem =
    | { type: 'note'; data: Note }
    | { type: 'file'; data: File };

  const messages: MessageItem[] = [
    ...notes.map((note) => ({ type: 'note' as const, data: note })),
    ...files.map((file) => ({ type: 'file' as const, data: file })),
  ].sort((a, b) => new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime());

  if (loading && !tree && !currentFolder) {
    return <div className="file-explorer-loading">Loading...</div>;
  }

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <div className="file-explorer-nav">
          <button
            className="nav-btn"
            onClick={goBack}
            disabled={breadcrumbs.length <= 1}
            title="Go back"
          >
            ←
          </button>
          <div className="breadcrumbs">
            {breadcrumbs.map((item, index) => (
              <span key={index} className="breadcrumb-item">
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                <button
                  className={`breadcrumb-btn ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                  onClick={() => navigateToBreadcrumb(index)}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="file-explorer-actions">
          <button onClick={() => setShowNewFolderModal(true)} title="New Folder">
            📁+
          </button>
          <button onClick={refreshCurrentView} title="Refresh">
            🔄
          </button>
        </div>
      </div>

      {error && <div className="file-explorer-error">{error}</div>}

      <div className="file-explorer-content">
        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="folders-section">
            {folders.map((folder) => (
              <div
                key={`folder-${folder.id}`}
                className="folder-item"
                onClick={() => navigateToFolder(folder)}
              >
                <span className="folder-icon">📁</span>
                <span className="folder-name">{folder.name}</span>
                <button
                  className="folder-delete"
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  title="Delete folder"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Messages Section - Notes and Files combined, sorted by created_at */}
        <div className="messages-section">
          {messages.length === 0 && folders.length === 0 ? (
            <div className="empty-state">
              No content yet. Start by writing a note below or creating a folder.
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-notes">
              No notes or files in this folder. Write a note or upload a file below.
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((item) => (
                item.type === 'note' ? (
                  editingNote?.id === item.data.id ? (
                    <div key={`note-${item.data.id}`} className="note-row">
                      <div className="note-bubble">
                        <div className="note-edit">
                          <textarea
                            value={editingNote.content}
                            onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                            onKeyDown={handleEditKeyDown}
                            autoFocus
                            rows={3}
                          />
                          <div className="note-edit-actions">
                            <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                            <button onClick={handleSaveEdit} className="save-btn">Save</button>
                          </div>
                        </div>
                      </div>
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date(item.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div key={`note-${item.data.id}`} className="note-row">
                      <div className="note-bubble">
                        <div
                          className="note-content"
                          onClick={() => handleStartEdit(item.data as Note)}
                          title="Click to edit"
                        >
                          {renderTextWithLinks((item.data as Note).note)}
                        </div>
                      </div>
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date(item.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          className="message-delete"
                          onClick={() => handleDeleteNote(item.data.id)}
                          title="Delete note"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div key={`file-${item.data.id}`} className="file-row">
                    <div className="file-bubble">
                      <span className="file-icon">📄</span>
                      <span className="file-name">{(item.data as File).name}</span>
                      <span className="file-size">{((item.data as File).size / 1024).toFixed(1)} KB</span>
                      <button
                        className="file-download-btn"
                        onClick={() => handleDownloadFile(item.data as File)}
                        title="Download file"
                      >
                        ⬇
                      </button>
                    </div>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(item.data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        className="message-delete"
                        onClick={() => handleDeleteFile(item.data.id)}
                        title="Delete file"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              ))}
              <div ref={notesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input Area */}
      <div className="message-input-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Upload file"
        >
          📎
        </button>
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder="Write a note... (Enter to send, Shift+Enter for new line)"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSubmitting}
        />
        <button
          className="send-btn"
          onClick={handleSendNote}
          disabled={isSubmitting || !newNoteContent.trim()}
          title="Send note"
        >
          ➤
        </button>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Folder</h3>
              <button onClick={() => setShowNewFolderModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNewFolderModal(false)}>Cancel</button>
              <button
                className="primary"
                onClick={handleCreateFolder}
                disabled={isSubmitting || !newFolderName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
