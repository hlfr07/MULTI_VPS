# 🚀 Quick Start Guide

## Running DroidVPS

Once you've completed the installation, follow these steps to start DroidVPS:

### Step 1: Navigate to the Project

Make sure you're in the cloned DroidVPS directory:

```bash
cd DroidVPS
```

### Step 2: Enter the Server Directory

Navigate to the server initialization folder:

```bash
cd server-init
```

### Step 3: Install Dependencies and Start

Install dependencies and start the server:

```bash
npm ci && npm start
```

### Step 4: Set Up Credentials

During the first run, you'll be prompted to create your login credentials:

- **Username**: Choose a secure username
- **Password**: Create a strong password

> **🔒 Security Note**: For your safety, please follow the on-screen instructions carefully when setting up your credentials.

### Step 5: Success!

If everything went correctly, you'll see this message:

```
🚀 ¡Todo listo! Accede al panel en http://${localIP}:4200
```

This means your DroidVPS is up and running! 🎉

You can now access the monitoring dashboard by opening the provided URL in your browser.

---

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies were installed correctly
2. Check that ports 4200 and required ports are available
3. Verify your Termux has necessary permissions
4. Review the logs for any error messages

## Next Steps

- Configure your environments
- Deploy your applications
- Monitor system resources
- Explore the dashboard features
