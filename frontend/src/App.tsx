import {
  Refine,
} from "@refinedev/core";
import { useEffect } from "react";
import {
  RefineThemes,
  useNotificationProvider,
  RefineSnackbarProvider,
} from "@refinedev/mui";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router-v6";
import { BrowserRouter,} from "react-router-dom";
import authProvider from "./authProvider";
import resources from "./resources";
import AppRoutes from "./routes";
import dataProvider from "@refinedev/simple-rest";

/**
 *  mock auth credentials to simulate authentication
 */

const blueTheme = createTheme({
...RefineThemes.Blue,
  typography: {
    fontFamily: 'inter, sans-serif',
  },
});

const authCredentials = {
  email: "admin@admin.com",
  password: "admin",
};

const API_URL = "http://localhost:5001/api";
console.log(API_URL);

const App: React.FC = () => {

  return (
    <BrowserRouter>
      <ThemeProvider theme={blueTheme}>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider(API_URL)}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={resources}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <AppRoutes />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
          
          </Refine>
        </RefineSnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
    
  );
};

export default App;
