import {Hono} from 'hono';
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign } from 'hono/jwt'
import {signinInput,signupInput}  from "@rachitshahrawat/medium-common"

export const userRouter=new Hono<{Bindings:{
    DATABASE_URL:string,
    JWT_SECRET:string
  }}>;

userRouter.post('signup', async(c) => {
  console.log("route hit");
  const body=await c.req.json();
  const { success} = signupInput.safeParse(body);
  const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_URL,
  }).$extends(withAccelerate())
 
try{
  const user= await prisma.user.create({
    data:{
        email:body.email,
        password:body.password
    },
   })
   const jwt=await sign({id:user.id},c.env.JWT_SECRET);

   return c.text(jwt)

  }
  catch(e){
    console.log(e);
    c.status(411);
    return c.json({error:"user already exists"})
  }
})
 


userRouter.post('/api/v1/signin', async (c) => {
  const body = await c.req.json();
  const { success} = signinInput.safeParse(body);
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());

try{
    const user = await prisma.user.findFirst({
        where: {
            email: body.email,
      password:body.password
        }
    });
  if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
    }
  const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
}

catch(e){
  console.log(e);
  c.status(411);
  return c.json({error:"user invalid"})
}
})