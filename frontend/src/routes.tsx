import {
    Authenticated,
  } from "@refinedev/core";
  import {
    ThemedLayoutV2,
    ErrorComponent,
    AuthPage,
    ThemedTitleV2,
  } from "@refinedev/mui";
  import FormControlLabel from "@mui/material/FormControlLabel";
  import Checkbox from "@mui/material/Checkbox";
  import {
    NavigateToResource,
    CatchAllNavigate,
  } from "@refinedev/react-router-v6";
  import { Routes, Route, Outlet } from "react-router-dom";
  import { useFormContext } from "react-hook-form";
  import GitHubIcon from "@mui/icons-material/GitHub";
  import GoogleIcon from "@mui/icons-material/Google";
  import { ImageList, ImageDetails, AttachPage,  } from "./pages/images";


  const authCredentials = {
    email: "admin@admin.com",
    password: "admin",
  };

  const RememberMe = () => {
    const { register } = useFormContext();

    return (
      <FormControlLabel
        sx={{
          span: {
            fontSize: "12px",
            color: "text.secondary",
          },
        }}
        color="secondary"
        control={
          <Checkbox size="small" id="rememberMe" {...register("rememberMe")} />
        }
        label="Remember me"
      />
    );
  };

const AppRoutes: React.FC = () => (
    
    <Routes>
    <Route
      element={
        <Authenticated
          key="authenticated-routes"
          fallback={<CatchAllNavigate to="/login" />}
        >
          <ThemedLayoutV2
            Title={({ collapsed }) => (
              <ThemedTitleV2
                // collapsed is a boolean value that indicates whether the <Sidebar> is collapsed or not
                collapsed={collapsed}
                text="Img-Dash"
                icon={
                  <svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg"  x="0px" y="0px"
                    viewBox="0 0 200 200" enable-background="new 0 0 200 200">
                  <rect x="20.96" y="22.28" fill="#FFFFFF" stroke="#000000" stroke-width="20" stroke-miterlimit="10" width="158.08" height="158.08"/>
                  <line fill="none" stroke="#000000" stroke-width="20" stroke-miterlimit="10" x1="179.04" y1="22.28" x2="20.96" y2="180.36"/>
                  <circle stroke="#000000" stroke-width="10" stroke-miterlimit="10" cx="100.15" cy="100.95" r="26.14"/>
                  <circle fill="none" cx="100.38" cy="100.95" r="35.61"/>
                  <circle fill="none" stroke="#000000" stroke-width="20" stroke-miterlimit="10" cx="55.76" cy="57.08" r="5.18"/>
                  </svg>

                }
              />
            )}
          >
            <Outlet />
          </ThemedLayoutV2>
        </Authenticated>
      }
    >
      <Route
        index
        element={<NavigateToResource resource="images" />}
      />
      <Route path="/images" element={<ImageList />} />
      <Route path="details/:id" element={<ImageDetails />} /> {/* Add the new route */}
      <Route path="attach/:id" element={<AttachPage />} />
      {/* <Route path="/images">
        <Route index element={<ImageList />} />     
        <Route path="imagelab/:id" element={<ImageLab />} /> */}
    </Route>

    <Route
      element={
        <Authenticated key="auth-pages" fallback={<Outlet />}>
          <NavigateToResource resource="images" />
        </Authenticated>
      }
    >
      <Route
        path="/login"
        element={
          <AuthPage
            type="login"
            rememberMe={<RememberMe />}
            formProps={{
              defaultValues: {
                ...authCredentials,
              },
            }}
            providers={[
              {
                name: "google",
                label: "Sign in with Google",
                icon: (
                  <GoogleIcon
                    style={{
                      fontSize: 24,
                    }}
                  />
                ),
              },
              {
                name: "github",
                label: "Sign in with GitHub",
                icon: (
                  <GitHubIcon
                    style={{
                      fontSize: 24,
                    }}
                  />
                ),
              },
            ]}
          />
        }
      />
      <Route
        path="/register"
        element={
          <AuthPage
            type="register"
            providers={[
              {
                name: "google",
                label: "Sign in with Google",
                icon: (
                  <GoogleIcon
                    style={{
                      fontSize: 24,
                    }}
                  />
                ),
              },
              {
                name: "github",
                label: "Sign in with GitHub",
                icon: (
                  <GitHubIcon
                    style={{
                      fontSize: 24,
                    }}
                  />
                ),
              },
            ]}
          />
        }
      />
      <Route
        path="/forgot-password"
        element={<AuthPage type="forgotPassword" />}
      />
      <Route
        path="/update-password"
        element={<AuthPage type="updatePassword" />}
      />
    </Route>

    <Route
      element={
        <Authenticated key="catch-all">
          <ThemedLayoutV2
            Title={({ collapsed }) => (
              <ThemedTitleV2
                // collapsed is a boolean value that indicates whether the <Sidebar> is collapsed or not
                collapsed={collapsed}
                text="Img-Dash"
                icon={
                  <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 395.95 404">
                  <g>
                    <path d="m13.75,403.5v-248.06h36.99c0,.06,0,.12,0,.18-.01.28-.02.56-.02.84,0,84.85,69.03,153.88,153.88,153.88s153.88-69.03,153.88-153.88c0-.28,0-.56-.02-.84,0-.06,0-.12,0-.18h36.99v248.06H13.75Z"/>
                    <path d="m394.95,155.94v247.06H14.25v-247.06h35.98c0,.17,0,.35,0,.52,0,41.24,16.06,80.01,45.22,109.17,29.16,29.16,67.93,45.22,109.17,45.22s80.01-16.06,109.17-45.22c29.16-29.16,45.22-67.93,45.22-109.17,0-.17,0-.35,0-.52h35.98m1-1h-38c0,.51.04,1.01.04,1.52,0,84.71-68.67,153.38-153.38,153.38S51.22,241.17,51.22,156.46c0-.51.03-1.01.04-1.52H13.25v249.06h382.7v-249.06h0Z"/>
                  </g>
                  <g>
                    <path d="m49.4,157.48c0-.08,0-.15,0-.23,0-.27-.02-.54-.02-.82C49.37,70.45,119.32.5,205.3.5s155.93,69.95,155.93,155.93c0,.27,0,.55-.02.82,0,.08,0,.15,0,.23H49.4Z"/>
                    <path d="m205.3,1c41.52,0,80.55,16.17,109.9,45.52,29.36,29.36,45.52,68.39,45.52,109.9,0,.18,0,.37-.01.55H49.88c0-.18-.01-.36-.01-.55,0-41.52,16.17-80.55,45.52-109.9S163.78,1,205.3,1m0-1C118.91,0,48.87,70.04,48.87,156.43c0,.52.03,1.03.04,1.55h312.78c0-.52.04-1.03.04-1.55C361.73,70.04,291.69,0,205.3,0h0Z"/>
                  </g>
                </svg>
                }
              />
            )}
          >
            <Outlet />
          </ThemedLayoutV2>
        </Authenticated>
      }
    >
      <Route path="*" element={<ErrorComponent />} />
    </Route>
  </Routes>
);

export default AppRoutes;