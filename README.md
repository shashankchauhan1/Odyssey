This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

=================================================================================================================================================================================================================================================================================================================================

Project Overview

Odyssey is a platform where you can plan a trip with the logistics required no need to search for how we reach , what we do their etc. all these things are provided in this single platform where you can redirected to book transport, generate a itenary for the trip, maintain a budget list using expense tracker and much more

1> Clerk -> Authentication Handler
It validate each request before the request reach to the server, like a not logged in user can't plan a trip
it says dont check the static files just be a gaurd of the /api route

2> Models
2.1> Destination
the information about the destination

2.2> Trips
the information about the trip 
number of days, travellers, budget and all

Summary of Data Flow
Step 1: User searches "Trip to Paris."
Step 2: App checks Destination DB. Does "Paris" exist?
        No: Ask AI -> Save to Destination DB.
        Yes: Load from Destination DB.
Step 3: User clicks "Create Trip."
Step 4: App creates a Trip document.
Sets userId to the logged-in user.
Sets destination to the ID of the Paris document.
Sets budget and dates.

3> destinationProfile.js

Summary: The Lifecycle of a Request
User searches "Tokyo".
> App: Checks Database. "Do we have Tokyo?" if(No).
> App: Calls defaultDestinationProfile('Tokyo') to make a temporary placeholder.
> App: Checks destinationNeedsEnrichment. Yes, it's just a placeholder.
> App: Calls the AI. "Tell me about Tokyo."
> AI: Sends back detailed info.
> App: Uses mergeNonEmpty to safely mix the placeholder with the AI data.
> App: Saves to Database.

4> Layout.js
It contains the components which are gonna used by every page

5> page.js
This is the home page which reflects the content according to the nature of user weather they are logged in or not


<<<<<<< HEAD
// feature that can be added if 5 member going then each member has teh acces add his expense and all
=======
// 5 services done
>>>>>>> 5a9b8bb565a9867f698f3e37c70cc82658f196dc
