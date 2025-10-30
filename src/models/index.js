import Blog from './blog.js'
import BlogAllowedRole from './blogAllowedRole.js'
import BlogCareer from './blogCareer.js'
import BlogNode from './blogNode.js'
import BlogSubject from './blogSubject.js'
import BlogTopic from './blogTopic.js'
import Career from './career.js'
import EmailDomainRole from './email_Domain_Role.js'
import Rol from './roles.js'
import Subject from './subject.js'
import Topic from './topic.js'
import User from './user.js'
import UserCareer from './userCareer.js'

Blog.hasMany(BlogNode, { foreignKey: 'blog_id' })
BlogNode.belongsTo(Blog, { foreignKey: 'blog_id' })
BlogNode.hasMany(BlogNode, { as: 'children', foreignKey: 'parent_id' })
BlogNode.belongsTo(BlogNode, { as: 'parent', foreignKey: 'parent_id' })

Blog.belongsToMany(Career, { through: BlogCareer, foreignKey: 'blog_id', otherKey: 'career_id' })
Career.belongsToMany(Blog, { through: BlogCareer, foreignKey: 'career_id', otherKey: 'blog_id' })

Blog.belongsToMany(Subject, { through: BlogSubject, foreignKey: 'blog_id', otherKey: 'subject_id' })
Subject.belongsToMany(Blog, { through: BlogSubject, foreignKey: 'subject_id', otherKey: 'blog_id' })

Blog.belongsToMany(Topic, { through: BlogTopic, foreignKey: 'blog_id', otherKey: 'topic_id' })
Topic.belongsToMany(Blog, { through: BlogTopic, foreignKey: 'topic_id', otherKey: 'blog_id' })

Blog.belongsToMany(Rol, { through: BlogAllowedRole, foreignKey: 'blog_id', otherKey: 'id_rol' })
Rol.belongsToMany(Blog, { through: BlogAllowedRole, foreignKey: 'id_rol', otherKey: 'blog_id' })

User.belongsToMany(Career, { through: UserCareer, foreignKey: 'id_usuario', otherKey: 'id_career' })
Career.belongsToMany(User, { through: UserCareer, foreignKey: 'id_career', otherKey: 'id_usuario' })

export {
    Blog, BlogAllowedRole, BlogCareer, BlogNode, BlogSubject, BlogTopic, Career, EmailDomainRole,
    Rol, Subject, Topic, User, UserCareer
}
