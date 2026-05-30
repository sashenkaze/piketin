import { createBrowserRouter } from "react-router-dom";
import App from "../App"; 
import Template from "../Template"
import LoginPage from "../pages/LoginPage";
import ManagePsRayon from "../pages/ManagePsRayon";
import ManageRayon from "../pages/ManageRayon";
import ManageKokurikuler from "../pages/ManageKokurikuler";

// membuat daftar routing
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Template />,
        children: [
            // Route untuk halaman login
            {
                path: "/", 
                element: <App />,
            },
            {
                path: "/login",
                element: <LoginPage />,
            },
            {
                path: "/manage-psrayon",
                element: <ManagePsRayon />
            },
            {
                path: "/manage-rayon",
                element: <ManageRayon />
            },
            {
                path: "/manage-kokurikuler",
                element: <ManageKokurikuler />
            }
        ],
    },
]);