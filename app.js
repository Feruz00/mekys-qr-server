const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { protect } = require('./middleware/jwt');
const path = require('path');
const errorHandler = require('./utils/errorHandler');
const AppError = require('./utils/appError');
require('dotenv').config();
const app = express();

app.use(morgan('dev'));

app.set('trust proxy', 1);

app.use(cookieParser());
const allowedOrigins =
  process.env.NODE_ENV === 'production' ? '*' : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// add here middleware jwt
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/', require('./routes/video'));

app.use('/api/users', require('./routes/user'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/files'));
app.use('/api/qr', require('./routes/qrcodes'));
app.use('/api/stream', require('./routes/stream'));

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

module.exports = app;
