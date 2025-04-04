import { Document } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  description: string;
  location: Record<string, any>;
  cuisine_types: string[];
  phone: string;
  website: string;
  hours: Record<string, any>;
  owner_id: number;
  status: string;
  rating: number;
  delivery_options: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  updatedAt?: Date;
}
