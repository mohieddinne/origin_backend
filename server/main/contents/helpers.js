const {
  Contents,
  tblEmployes,
  UnreadArticle,
  sequelize,
} = require("../../models");
const utilsHelpers = require("../../helpers/utils.helper");
const excerptHelper = require("../../helpers/excerpt.helper");
const config = require("../../config");
const slugify = require("slugify");
const jsdom = require("jsdom");

/**
 * Get data
 * @param array ids
 */
module.exports.getData = async function (ids, user_id = 0, admin = false) {
  let where = {};
  // Verify and clean data
  if (ids) {
    if (!Array.isArray(ids)) {
      return false;
    }
    ids = ids.map(Number).filter((item) => item > 0);
    if (ids.length > 0) {
      where = {
        id: ids,
      };
    }
  }

  // Get data
  const tempData = await Contents.findAll({
    where,
    include: [
      {
        model: tblEmployes,
        as: "author",
      },
    ],
    order: [
      ["publishedAt", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit: 50, // TODO
  });

  // Special traitments
  const data = [];
  const today = new Date();
  for (let element of tempData) {
    // if still null look for the first picture of the content
    if (element.featured_image === null) {
      const { JSDOM } = jsdom;
      const dom = new JSDOM(element.content);
      const imgs = dom.window.document.getElementsByTagName("img");
      if (imgs.length > 0) {
        const src = imgs[0].getAttribute("src");
        if (src) {
          element.featured_image = src;
        }
      }
    }
    // render the image url
    if (element.featured_image !== null) {
      element.featured_image = await utilsHelpers.renderFilePublicUrl(
        element.featured_image,
        config.folders.upload_content_image
      );
    }
    // if no slug, render one
    if (element.slug === null) {
      element.slug = slugify(element.title).toLowerCase();
    }
    // if no excerpt, render one
    if (element.excerpt === null) {
      element.excerpt = excerptHelper(element.content);
    }
    // Published date
    if (!element.publishedAt) {
      element.publishedAt = element.createdAt;
    }
    // add unreads news

    // Check the content status
    switch (element.status) {
      case 1: // Published
        const publishedAt = new Date(element.publishedAt);
        const isToday =
          publishedAt.getFullYear() === today.getFullYear() &&
          publishedAt.getMonth() === today.getMonth() &&
          publishedAt.getDate() === today.getDate();
        if (
          user_id === element.author_id ||
          admin ||
          isToday ||
          publishedAt.getTime() < today.getTime()
        ) {
          data.push(element);
        }
        break;
      case 2: // Draft
        if (user_id === element.author_id || admin) {
          // if the request cames for the author or an admin
          data.push(element);
        }
        break;
      case 3: // Hidden
        if (user_id === element.author_id) {
          // if the request cames for the author
          data.push(element);
        }
        break;
      default:
        break;
    }
  }
  return data;
};

/**
 * Create a content
 * @param object data
 * @returns boolean
 */
module.exports.create = async function (userId, row_data) {
  // Verify and clean data
  if (!row_data || row_data.length <= 0) {
    return false;
  }

  // Get the data
  let data = row_data;

  // Clean data
  data.author_id = parseInt(data.author_id);
  if (row_data.id !== undefined) {
    delete data.id;
  }
  if (row_data.category !== null && row_data.category !== undefined) {
    data.category = parseInt(row_data.category);
  }

  // Required data
  if (data.author_id <= 0 || data.title === "" || data.content === "") {
    console.error("Error: required data");
    return false;
  }

  // Set default status if null
  if (row_data.status === null || row_data.status === undefined) {
    data.status = 1; // Published
  }

  // if no slug, render one
  if (data.slug === null || data.slug === undefined) {
    data.slug = slugify(data.title).toLowerCase();
  }

  // Published date
  if (!data.publishedAt) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
    const yyyy = today.getFullYear();
    data.publishedAt = yyyy + "-" + mm + "-" + dd;
  }

  // set defaults
  data.views = 0;

  let errors = [];
  // Get all active user
  const article = await Contents.create(data, {
    fields: Object.keys(data), // Force the ORM to not add the [id] column
  })
    .then((res) => (data = res))
    .catch(function (err) {
      console.error(err);
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }
  if (row_data?.status === 1) this.toggleMarckNews(userId, article.id);

  return data.id;
};

/**
 * Update data
 * @param array data
 * @return boolean
 */
module.exports.update = async function (data) {
  // Verify and clean data
  if (!data || data.length <= 0 || !data.id) {
    return false;
  }

  const errors = [],
    { id } = data;
  delete data.id;
  await Contents.update(data, {
    where: {
      id,
    },
  })
    .then(() => {
      // Silence is gold
    })
    .catch(function (err) {
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return true;
};

/**
 * Delete data
 * @param array data
 * @return boolean
 */
module.exports.delete = async function (ids) {
  // Verify and clean data
  if (!ids) {
    return false;
  }
  // Filter the input
  ids = ids.map(Number).filter((item) => item > 0);
  if (!Array.isArray(ids) || ids.length <= 0) {
    return false;
  }

  //destroy

  let errors = [];
  await Contents.destroy({
    where: {
      id: ids,
    },
  })
    .then(() => {
      // Delete article from unreads
      UnreadArticle.destroy({
        where: { articleId: ids },
      });
    })
    .catch(function (err) {
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return true;
};

/**
 * Increment views on a content
 * @param integer id
 * @return boolean
 */
module.exports.incrementViews = async function (id) {
  // Verify and clean data
  if (!id || id <= 0) {
    return false;
  }

  const errors = [];
  // A.update({ field: Sequelize.literal('field + 2') }, { where: { id: 1 }}))
  await Contents.update(
    {
      views: sequelize.literal("views + 1"),
    },
    {
      where: {
        id,
      },
    }
  )
    .then(() => {
      // Silence is gold
    })
    .catch(function (err) {
      errors.push(err);
    });

  if (errors.length > 0) {
    return false;
  }

  return true;
};
module.exports.toggleMarckNews = async function (userId, articleId) {
  console.log({ userId });
  const articleRead = await UnreadArticle.findAll({
    where: {
      articleId: parseInt(articleId),
      userId,
    },
  });
  if (articleRead.length > 0) {
    return await UnreadArticle.destroy({
      where: { articleId, userId },
    }).then(async () => {
      const data = await UnreadArticle.findAll({
        where: {
          userId,
          articleId: parseInt(articleId),
        },
      });
      return data ? data.length : 0;
    });
  } else {
    const users = await tblEmployes.findAll({ attributes: ["id_Emp"] });
    const promises = users.map((user) => {
      if (userId !== user.id_Emp) {
        return UnreadArticle.create({
          userId: user.id_Emp,
          articleId,
        });
      }
    });
    await Promise.all(promises);
  }
  const data = await UnreadArticle.findAll({
    where: {
      userId,
    },
  });
  return data.length;
};
