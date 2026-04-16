import { createBrowserRouter } from "react-router";
import SwitzerlandPage from "./pages/SwitzerlandPage";
import EuropePage from "./pages/EuropePage";
import HomePage from "./pages/HomePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/europe",
    element: <EuropePage />,
  },
  {
    path: "/switzerland",
    element: <SwitzerlandPage />,
  },
  ],
  {
    basename: "/EUFLOW/",
  }
);