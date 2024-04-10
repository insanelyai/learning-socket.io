import express from "express";
import http from "http";
import { Server as SocketIo } from "socket.io";
import multer from "multer";
import fs from "fs";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new SocketIo(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
    // Allow requests from this origin
  })
);

let posts = [];

console.log(posts);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

app.get("/api/posts", (req, res) => {
  res.json(posts);
});

app.post("/api/posts", upload.single("image"), (req, res) => {
  const { description } = req.body;
  const imageUrl = req.file ? req.file.path : null;
  const newPost = {
    id: Date.now(),
    description,
    imageUrl,
    likes: 0,
    comments: [],
  };
  posts.push(newPost);
  console.log(posts);

  io.emit("new-post");
  res.status(201).json({
    message: "Post created successfully",
    post: newPost,
    redirectUrl: "http://localhost:3000/",
  });
});

app.post("/api/posts/:postId/like", (req, res) => {
  const postId = req.params.postId;

  const post = posts.find((post) => post.id === parseInt(postId));
  if (post) {
    post.likes++;
    io.emit("new-like");

    res.json({ message: "Like added successfully" });
  } else {
    console.log("No Posts Found");
    res.status(404).json({ error: "Post not found" });
  }
});

app.post("/api/posts/:postId/comment", (req, res) => {
  const postId = req.params.postId;
  const { ucomment } = req.body;
  console.log(postId);
  const post = posts.find((p) => p.id === parseInt(postId));
  if (post) {
    post.comments.push(ucomment);
    io.emit("new-comment");
    res.json({ message: "Comment added successfully" });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

app.use("/uploads", express.static("uploads"));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
