import { db } from './src/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const seedListings = [
  {
    title: "SaaS Platform for E-commerce",
    description: "A profitable SaaS platform specializing in inventory management for Shopify stores. 85% gross margins, low churn.",
    industry: "Technology",
    revenue: 1200000,
    ebitda: 450000,
    askingPrice: 1800000,
    location: "Remote / Florida",
    isFranchise: false,
    status: "active",
    verified: true,
    sellerId: "system-seed-1",
    createdAt: serverTimestamp()
  },
  {
    title: "Upscale Italian Restaurant",
    description: "Well-established Italian restaurant in a prime downtown location. Full liquor license included. Loyal customer base.",
    industry: "Food & Beverage",
    revenue: 2500000,
    ebitda: 350000,
    askingPrice: 950000,
    location: "Austin, TX",
    isFranchise: false,
    status: "active",
    verified: true,
    sellerId: "system-seed-2",
    createdAt: serverTimestamp()
  },
  {
    title: "Gym Franchise Opportunity",
    description: "Turnkey fitness center franchise. Modern equipment, high-traffic area, recurring membership revenue.",
    industry: "Health & Fitness",
    revenue: 600000,
    ebitda: 120000,
    askingPrice: 450000,
    location: "San Diego, CA",
    isFranchise: true,
    status: "active",
    verified: false,
    sellerId: "system-seed-3",
    createdAt: serverTimestamp()
  },
  {
    title: "HVAC Service Company",
    description: "Residential and commercial HVAC service provider with 15 service vehicles and long-term contracts.",
    industry: "Home Services",
    revenue: 4200000,
    ebitda: 850000,
    askingPrice: 3200000,
    location: "Atlanta, GA",
    isFranchise: false,
    status: "active",
    verified: true,
    sellerId: "system-seed-4",
    createdAt: serverTimestamp()
  }
];

async function seed() {
  for (const listing of seedListings) {
    try {
      await addDoc(collection(db, 'listings'), listing);
      console.log(`Added ${listing.title}`);
    } catch (e) {
      console.error(e);
    }
  }
}

seed();
