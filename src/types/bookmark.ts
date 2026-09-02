export type Bookmark = {
  id: string;
  title: string;
  url: string;
  favorite: boolean;
  createdAt: number;
  updatedAt?: number;
  /** Position within the favorites grid. Undefined until the user reorders. */
  sortOrder?: number;
};

/** The editable fields of a bookmark, as the add/edit form works with them. */
export type BookmarkDraft = {
  url: string;
  title: string;
  favorite: boolean;
};
