package com.auth0.example;

import com.auth0.AuthenticationController;
import com.auth0.IdentityVerificationException;
import com.auth0.Tokens;
import com.auth0.SessionUtils;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * CallbackServlet - Captures requests to the Callback URL and processes the data to obtain credentials.
 * After a successful login, the credentials are saved to the request's HttpSession.
 */
public class CallbackServlet extends HttpServlet {

    private AuthenticationController authenticationController;
    private String redirectOnSuccess = "/portal/home";
    private String redirectOnFail = "/login";

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        try {
            authenticationController = AuthenticationControllerProvider.getInstance(config);
        } catch (Exception e) {
            throw new ServletException("Couldn't create the AuthenticationController instance", e);
        }
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        handle(req, res);
    }

    @Override
    public void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException, ServletException {
        handle(req, res);
    }

    /**
     * Handles the authentication callback from Auth0.
     * Processes the authorization code and exchanges it for tokens.
     *
     * @param req The HTTP request
     * @param res The HTTP response
     * @throws IOException if an I/O error occurs
     */
    private void handle(HttpServletRequest req, HttpServletResponse res) throws IOException {
        try {
            // Parse the request and exchange the authorization code for tokens
            Tokens tokens = authenticationController.handle(req, res);

            // Store tokens in the session
            SessionUtils.set(req, "accessToken", tokens.getAccessToken());
            SessionUtils.set(req, "idToken", tokens.getIdToken());

            // Redirect to the protected home page
            res.sendRedirect(redirectOnSuccess);
        } catch (IdentityVerificationException e) {
            e.printStackTrace();
            // Redirect back to login on failure
            res.sendRedirect(redirectOnFail);
        }
    }
}
