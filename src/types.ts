export type Paint = {
  authorId: number;
  created: number;
  id: number;
  imageUrl: string;
  locationId: number;
  name: string;
};

export type Paints = Paint[];

export type Author = {
  id: number;
  name: string;
};

export type Authors = Author[];

export type Location = {
  id: number;
  location: string;
};

export type Locations = Location[];

export type Option = {
  id: number;
  value: string;
};

export type Options = Option[];
