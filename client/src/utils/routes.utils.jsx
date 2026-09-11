import React from "react";
import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  Add,
  Gig,
  Gigs,
  MyGigs,
  Home,
  Message,
  Messages,
  Orders,
  Login,
  Register,
  Pay,
  Success,
  Admin,
  Earnings,
  Wallet,
  Library,
  Policy,
  Wishlist,
  OrderDetail,
  TalentDashboard,
  About,
  Account,
  TalentVouchers,
  Cart,
} from "../pages";

import { Navbar, Footer } from "../components";
import ScrollToTop from "../components/scrollToTop/ScrollToTop";

const queryClient = new QueryClient();

const Layout = () => {
  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};
const Routes = [
  {
    path: "/",
    element: <QueryClientProvider client={queryClient}><ScrollToTop /><Outlet /></QueryClientProvider>,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
          {
            path: "/gigs",
            element: <Gigs />,
          },
          {
            path: "/mygigs",
            element: <MyGigs />,
          },
          {
            path: "/orders",
            element: <Orders />,
          },
          {
            path: "/orders/:id",
            element: <OrderDetail />,
          },
          {
            path: "/gig/:id",
            element: <Gig />,
          },
          {
            path: "/messages",
            element: <Messages />,
          },
          {
            path: "/message/:id",
            element: <Message />,
          },
          {
            path: "/add",
            element: <Add />,
          },
          {
            path: "/pay/:id",
            element: <Pay />,
          },
          {
            path: "/success",
            element: <Success />,
          },
          {
            path: "/admin",
            element: <Admin />,
          },
          {
            path: "/earnings",
            element: <Earnings />,
          },
          {
            path: "/wallet",
            element: <Wallet />,
          },
          {
            path: "/library",
            element: <Library />,
          },
          {
            path: "/policy",
            element: <Policy />,
          },
          {
            path: "/wishlist",
            element: <Wishlist />,
          },
          {
            path: "/cart",
            element: <Cart />,
          },
          {
            path: "/talent/dashboard",
            element: <TalentDashboard />,
          },
          {
            path: "/about",
            element: <About />,
          },
          {
            path: "/account",
            element: <Account />,
          },
          {
            path: "/talent/vouchers",
            element: <TalentVouchers />,
          },
        ],
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
    ],
  },
];

export default Routes;
