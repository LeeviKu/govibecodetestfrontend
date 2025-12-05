import { apiClient, getAccessToken } from './client';

const API_URL = 'http://localhost:8080/api/v1';

export interface Note {
  id: number;
  note: string;
  folder_id: number | null;
  created_at: string;
}

export interface File {
  id: number;
  name: string;
  size: number;
  mime_type: string;
  folder_id: number | null;
  created_at: string;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  folders?: Folder[];
  notes?: Note[];
  files?: File[];
}

export interface FolderTree {
  folders: Folder[];
  notes: Note[];
  files: File[];
}

// Folders
export async function getFolders(): Promise<{ folders: Folder[] }> {
  return apiClient('/folders');
}

export async function getFolderTree(): Promise<FolderTree> {
  return apiClient('/folders/tree');
}

export async function getFolder(id: number): Promise<{ folder: Folder }> {
  return apiClient(`/folders/${id}`);
}

export async function createFolder(name: string, parentId?: number): Promise<{ message: string; folder: Folder }> {
  return apiClient('/folders', {
    method: 'POST',
    body: JSON.stringify({ name, parent_id: parentId }),
  });
}

export async function deleteFolder(id: number): Promise<{ message: string }> {
  return apiClient(`/folders/${id}`, {
    method: 'DELETE',
  });
}

// Notes
export async function getNotes(): Promise<{ notes: Note[] }> {
  return apiClient('/notes');
}

export async function createNote(note: string, folderId?: number): Promise<{ message: string; note: Note }> {
  return apiClient('/notes', {
    method: 'POST',
    body: JSON.stringify({ note, folder_id: folderId }),
  });
}

export async function updateNote(id: number, note: string, folderId?: number | null): Promise<{ message: string; note: Note }> {
  return apiClient(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ note, folder_id: folderId }),
  });
}

export async function deleteNote(id: number): Promise<{ message: string }> {
  return apiClient(`/notes/${id}`, {
    method: 'DELETE',
  });
}

// Files
export async function getFiles(): Promise<{ files: File[] }> {
  return apiClient('/files');
}

export async function uploadFile(file: globalThis.File, folderId?: number): Promise<{ message: string; file: File }> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId !== undefined) {
    formData.append('folder_id', folderId.toString());
  }

  return apiClient('/files', {
    method: 'POST',
    body: formData,
  });
}

export async function downloadFile(id: number): Promise<Blob> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/files/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to download file');
  }

  return res.blob();
}

export async function deleteFile(id: number): Promise<{ message: string }> {
  return apiClient(`/files/${id}`, {
    method: 'DELETE',
  });
}
