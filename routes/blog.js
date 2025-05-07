const express = require("express");
const router = express.Router();

const {
  createBlog,
  deleteBlog,
  fetchAllBlogs,
  fetchBlogById,
} = require("../controllers/blog");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/create", isAdmin, createBlog);
router.delete("/delete/:id", isAdmin, deleteBlog);
router.get("/all", fetchAllBlogs);
router.get("/fetchById/:id", fetchBlogById);

module.exports = router;
