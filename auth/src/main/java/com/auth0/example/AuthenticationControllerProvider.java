package com.auth0.example;

import com.auth0.AuthenticationController;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;

import javax.servlet.ServletConfig;
import java.io.UnsupportedEncodingException;

/**
 * Responsible for creating and managing a single instance of the AuthenticationController.
 * The AuthenticationController is thread-safe and intended to be reused.
 */
public class AuthenticationControllerProvider {

    private AuthenticationControllerProvider() {}

    private static AuthenticationController INSTANCE;

    /**
     * Gets the singleton instance of AuthenticationController.
     * If multiple threads may call this method, consider synchronizing and double-checking locking.
     *
     * @param config The ServletConfig to read Auth0 configuration from
     * @return The AuthenticationController instance
     * @throws UnsupportedEncodingException if encoding is not supported
     */
    public static AuthenticationController getInstance(ServletConfig config) throws UnsupportedEncodingException {
        if (INSTANCE == null) {
            String domain = config.getServletContext().getInitParameter("com.auth0.domain");
            String clientId = config.getServletContext().getInitParameter("com.auth0.clientId");
            String clientSecret = config.getServletContext().getInitParameter("com.auth0.clientSecret");

            if (domain == null || clientId == null || clientSecret == null) {
                throw new IllegalArgumentException("Missing domain, clientId, or clientSecret. Did you update src/main/webapp/WEB-INF/web.xml?");
            }

            // JwkProvider required for RS256 tokens. If using HS256, do not use.
            JwkProvider jwkProvider = new JwkProviderBuilder(domain).build();
            INSTANCE = AuthenticationController.newBuilder(domain, clientId, clientSecret)
                    .withJwkProvider(jwkProvider)
                    .build();
        }

        return INSTANCE;
    }

    /**
     * Gets the Auth0 domain from servlet configuration.
     *
     * @param config The ServletConfig to read from
     * @return The Auth0 domain
     */
    public static String getDomain(ServletConfig config) {
        return config.getServletContext().getInitParameter("com.auth0.domain");
    }

    /**
     * Gets the Auth0 client ID from servlet configuration.
     *
     * @param config The ServletConfig to read from
     * @return The Auth0 client ID
     */
    public static String getClientId(ServletConfig config) {
        return config.getServletContext().getInitParameter("com.auth0.clientId");
    }
}
