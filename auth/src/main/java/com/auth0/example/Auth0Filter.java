package com.auth0.example;

import com.auth0.SessionUtils;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Auth0Filter - A WebFilter that checks for existing tokens before giving the user
 * access to protected paths (/portal/*).
 * If the tokens don't exist, the request will be redirected to the LoginServlet.
 */
public class Auth0Filter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // No initialization required
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Check if the user has valid tokens in their session
        String accessToken = (String) SessionUtils.get(req, "accessToken");
        String idToken = (String) SessionUtils.get(req, "idToken");

        if (accessToken == null && idToken == null) {
            // No tokens found - redirect to login
            res.sendRedirect("/login");
            return;
        }

        // Tokens exist - allow the request to proceed
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // No cleanup required
    }
}
