import {Hono} from 'hono';
import {PrismaClient} from '@prisma/client/edge';    
import {verify} from "hono/jwt"
import {withAccelerate} from '@prisma/extension-accelerate';
import { createBlogInput , updateBlogInput } from "@rachitshahrawat/medium-common"

export const blogRouter=new Hono<{Bindings:{
    DATABASE_URL:string,
    JWT_SECRET:string,
  },
  Variables:{
    userId:any;
  }
}>;


  blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
  
    try {
      const user = await verify(token, c.env.JWT_SECRET);
      if(user){
      c.set("userId", user.id);
      await next();
      }
    } catch (err) {
      console.log("JWT verification error:", err);

      c.status(403);
      return c.json({ message: "You are not logged in" });
    }
  });
  

   blogRouter.post('/', async (c) => {
    const body=await c.req.json();
    const userId=c.get("userId");
    const { success} = createBlogInput.safeParse(body);
    const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,
  }).$extends(withAccelerate())
 
  const Blog=await prisma.blog.create({
    data:{
        title:body.title,
        content:body.content,
        authorId:userId,
    },
  })
    return c.json({
        id:Blog.id
    })
  })
  
  blogRouter.put('/', async (c) => {
    const body=await c.req.json();
    const { success} = updateBlogInput.safeParse(body);
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog=await prisma.blog.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content,
        },
      })
    return c.json({
        id:blog.id
    })
  })

  blogRouter.get('/bulk', async (c) => {
    
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
    const blog=await prisma.blog.findMany();
    return c.json({
        blog
    })
}
catch(e){
    console.log(e);
    c.status(411);
    return c.json({error:"blog not found"})
}
  })
  
  blogRouter.get('/:id', async (c) => {
    const id=await c.req.param("id");
    const prisma=new PrismaClient({
      datasourceUrl:c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
    const blog=await prisma.blog.findFirst({
        where:{
            id:id
        },
        })
    return c.json({
        blog
    })
}
catch(e){
    console.log(e);
    c.status(411);
    return c.json({error:"blog not found"})
}
  })




