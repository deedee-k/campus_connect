import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email(),
  studentNumber: z.string().min(3, 'Enter your student number'),
  password: z.string().min(6, 'At least 6 characters'),
  role: z.enum(['buyer', 'seller'], {
    message: 'Choose how you want to use CampusConnect',
  }),
});

export const listingSchema = z.object({
  title: z.string().min(5, 'Title needs at least 5 characters'),
  description: z.string().min(20, 'Describe your item (min 20 characters)'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  category: z.enum(
    ['Textbooks', 'Electronics', 'Stationery', 'Clothing', 'Other'],
    { message: 'Choose a category' }
  ),
  
  stock: z.coerce.number().min(1, 'Stock must be at least 1').default(1),
  condition: z.enum(
    ['New', 'Like new', 'Good', 'Fair'],
    { message: 'Choose a condition' }
  ),
  imageUrl: z
    .string()
    .url('Image URL must be valid')
    .optional()
    .or(z.literal('')),
    
});