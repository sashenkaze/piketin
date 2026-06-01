import { createBrowserRouter } from "react-router-dom";
import App from "../App"; 
import Template from "../Template"
import LoginPage from "../pages/LoginPage";
import ManagePsRayon from "../pages/ManagePsRayon";
import ManageRayon from "../pages/ManageRayon";
import ManageKokurikuler from "../pages/ManageKokurikuler";
import ManageMurid from "../pages/ManageMurid";
import AbsenPiketRayon from "../pages/AbsenPiketRayon";
import AbsenWc from "../pages/AbsenWc";
import ManageJenisPekerjaan from "../pages/ManageJenisPekerjaan";
import ManagePiketWc from "../pages/ManagePiketWc";
import ManageSubmissionPiket from "../pages/ManageSubmissionPiket";

// membuat daftar routing
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Template />,
        children: [
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
            },
            {
                path: "/manage-murid",
                element: <ManageMurid />
            },
            {
                path: "/absen-rayon",
                element: <AbsenPiketRayon />
            },
            {
                path: "/absen-wc",
                element: <AbsenWc />
            },
            {
                path: "/jenis-pekerjaan",
                element: <ManageJenisPekerjaan />
            },
            {
                path: "/manage-piket-wc",
                element: <ManagePiketWc />
            },
            {
                path: "/submission-piket",
                element: <ManageSubmissionPiket />
            }
        ],
    },
]);