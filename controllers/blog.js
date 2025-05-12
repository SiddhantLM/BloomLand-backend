const Blog = require("../models/blog");
const path = require("path");

exports.createBlog = async (req, res) => {
  try {
    const { title, subtitle, content } = req.body;

    if (!title || !subtitle || !content) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    let imageUrl = null;
    if (req.files && req.files.image) {
      const file = req.files.image;
      const imageName = file.name.replace(/[^a-z0-9.\-_]/gi, "_");
      const fileName = `${Date.now()}-${imageName}`;
      const filePath = path.join(__dirname, "..", "uploads", fileName);
      await file.mv(filePath);
      imageUrl = `${process.env.BACKEND_URL}/uploads/${fileName}`;
    }

    const newBlog = await Blog.create({
      title: title,
      content: content,
      subtitle: subtitle,
      image: imageUrl,
    });
    await newBlog.save();

    return res.status(200).json({
      message: "Blog created successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while creating the blog",
    });
  }
};

exports.fetchAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({});
    if (!blogs) {
      return res.status(404).json({
        message: "Unable to fetch blogs from the databse",
      });
    }

    return res.status(200).json({
      blogs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while fetching the blogs",
    });
  }
};

exports.fetchBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "Blog ID not found",
      });
    }
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        message: "Unable to fetch the blog from the databse",
      });
    }

    return res.status(200).json({
      blog,
    });
  } catch (error) {
    console.log(error);
    return (
      res.status(500),
      json({
        message: "Error while fetching the blogs",
      })
    );
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "Blog ID not found",
      });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    await blog.deleteOne();
    return res.status(200).json({
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while deleting the blog",
    });
  }
};
