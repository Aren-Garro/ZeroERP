<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZeroERP - Home</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background-color: #1a1a2e;
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logout-btn {
            background-color: #e74c3c;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            font-size: 0.875rem;
        }
        .logout-btn:hover {
            background-color: #c0392b;
        }
        .container {
            flex: 1;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            width: 100%;
        }
        .welcome-card {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
        }
        .welcome-card h1 {
            color: #1a1a2e;
            margin-bottom: 1rem;
        }
        .welcome-card p {
            color: #666;
            line-height: 1.6;
        }
        .token-section {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .token-section h2 {
            color: #1a1a2e;
            margin-bottom: 1rem;
            font-size: 1.25rem;
        }
        .token-item {
            margin-bottom: 1.5rem;
        }
        .token-label {
            font-weight: 600;
            color: #333;
            margin-bottom: 0.5rem;
        }
        .token-value {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 0.75rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.75rem;
            word-break: break-all;
            color: #495057;
            max-height: 100px;
            overflow-y: auto;
        }
        .success-badge {
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">
            <div class="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            ZeroERP
        </div>
        <a href="/logout" class="logout-btn">Logout</a>
    </header>

    <main class="container">
        <div class="welcome-card">
            <span class="success-badge">Authenticated</span>
            <h1>Welcome to ZeroERP</h1>
            <p>You have successfully logged in using Auth0. Your authentication tokens are displayed below for debugging purposes.</p>
        </div>

        <div class="token-section">
            <h2>Authentication Tokens</h2>

            <div class="token-item">
                <div class="token-label">Access Token:</div>
                <div class="token-value">
                    <c:choose>
                        <c:when test="${not empty accessToken}">
                            ${accessToken}
                        </c:when>
                        <c:otherwise>
                            <em>No access token available</em>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>

            <div class="token-item">
                <div class="token-label">ID Token:</div>
                <div class="token-value">
                    <c:choose>
                        <c:when test="${not empty idToken}">
                            ${idToken}
                        </c:when>
                        <c:otherwise>
                            <em>No ID token available</em>
                        </c:otherwise>
                    </c:choose>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
