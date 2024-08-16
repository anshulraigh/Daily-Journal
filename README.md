# Daily Journal

## Overview
Daily Journal is a Node.js-based web application that allows users to register, log in, and compose journal entries. Users can also browse and view their past journal entries. The application is built with a focus on simplicity and ease of use, leveraging EJS templating for the frontend and MongoDB for the backend data storage.

## Project Structure

- **config/**: Contains configuration files for the project.
  - `mongoose.js`: MongoDB connection setup using Mongoose.
  - `passport.js`: User authentication setup using Passport.js.

- **models/**: Contains Mongoose models.
  - `Post.js`: Defines the schema for journal posts.
  - `User.js`: Defines the schema for user registration and authentication.

- **public/css/**: Contains CSS files for styling the frontend of the application.

- **views/**: Contains EJS templates for rendering the frontend.
  - **partials/**: Reusable EJS partials for the application.
  - `about.ejs`: About page template.
  - `compose.ejs`: Template for composing a new journal entry.
  - `contact.ejs`: Contact page template.
  - `home.ejs`: Home page template.
  - `login.ejs`: Login page template.
  - `post.ejs`: Template for displaying individual journal entries.
  - `register.ejs`: Registration page template.

- **.env**: Environment variables file for storing sensitive information like API keys, database URIs, etc.

- **.gitignore**: Specifies files and directories to be ignored by Git.

- **app.js**: The main entry point of the application, handling server setup, routing, and middleware.

- **package.json**: Contains metadata about the project and lists its dependencies.

- **package-lock.json**: Locks the versions of the project's dependencies.

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/daily-journal.git
    ```

2. Navigate to the project directory:

    ```bash
    cd daily-journal
    ```

3. Install the dependencies:

    ```bash
    npm install
    ```

4. Create a `.env` file in the root directory and add your environment variables:

    ```plaintext
    MONGODB_URI=your-mongodb-uri
    SESSION_SECRET=your-session-secret
    ```

5. Start the application:

    ```bash
    npm start
    ```

6. Open your browser and navigate to `http://localhost:3000`.

## Features

- User registration and login with authentication.
- Create, view, and manage journal entries.
- Simple and clean user interface.
- Secure password handling using Passport.js.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- EJS (Embedded JavaScript templates)
- CSS

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## Contact

For any inquiries or support, please contact [anshulrai077@gmail.com].
