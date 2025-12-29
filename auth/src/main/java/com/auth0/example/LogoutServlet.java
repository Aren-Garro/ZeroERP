package com.auth0.example;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * LogoutServlet - Invoked when the user clicks the logout link.
 * The servlet invalidates the user session and redirects the user to Auth0's logout endpoint,
 * which then redirects back to the login page.
 */
public class LogoutServlet extends HttpServlet {

    private String domain;
    private String clientId;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        domain = AuthenticationControllerProvider.getDomain(config);
        clientId = AuthenticationControllerProvider.getClientId(config);
    }

    @Override
    protected void doGet(final HttpServletRequest request, final HttpServletResponse response) throws ServletException, IOException {
        // Invalidate the session if it exists
        if (request.getSession() != null) {
            request.getSession().invalidate();
        }

        // Build the return URL (where to redirect after logout)
        String returnUrl = String.format("%s://%s", request.getScheme(), request.getServerName());
        if ((request.getScheme().equals("http") && request.getServerPort() != 80) ||
            (request.getScheme().equals("https") && request.getServerPort() != 443)) {
            returnUrl += ":" + request.getServerPort();
        }
        returnUrl += "/login";

        // Build Auth0 logout URL
        // Format: https://{YOUR-DOMAIN}/v2/logout?client_id={YOUR-CLIENT-ID}&returnTo={RETURN-URL}
        String logoutUrl = String.format(
                "https://%s/v2/logout?client_id=%s&returnTo=%s",
                domain,
                clientId,
                returnUrl
        );

        // Redirect to Auth0 logout endpoint
        response.sendRedirect(logoutUrl);
    }
}
