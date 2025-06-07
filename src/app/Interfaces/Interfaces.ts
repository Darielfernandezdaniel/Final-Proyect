export interface DalleImageResponse {
  imageUrl: string;
}

export interface ImageData {
  pushId: string;
  albumTitle: string;
  uploadedAt: number;
  url: string;
  nickname: string
}

export interface Album {
  title: string;
  images: string[]; 
  id?: string; 
}

export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  isOwner: boolean;
}

export interface UserData {
  user: string;
  date: number;
  uid: string;
}
