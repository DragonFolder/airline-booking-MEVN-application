@echo off
call npm init -y
call npm install express mongoose nodemon dotenv cors bcryptjs jsonwebtoken passport passport-google-oauth express-session nanoid

if not exist ".env" (
    (
        echo PORT=
        echo MONGODB_STRING=""
        echo JWT_SECRET_KEY=""
        echo CLIENT_ID=
        echo CLIENT_SECRET=
    )> .env
)

if not exist ".gitignore" (
    (
        echo node_modules
        echo .env
    )> .gitignore
)

echo Setup complete.
echo Please fill in .env file
pause
