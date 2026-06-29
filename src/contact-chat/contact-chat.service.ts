import { Injectable,ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ContactChatService {
    constructor(private prisma:PrismaService){}

    async getContacts(userId:string){
        console.log('getContacts called with userId:', userId);
        const contacts=await this.prisma.contact.findMany({
            where:{
                OR:[{user1Id:userId},{user2Id:userId}]
            },
            include:{
                user1:{select:{id:true,displayName:true,profilePictureUrl:true}},
                user2:{select:{id:true,displayName:true,profilePictureUrl:true}}
            },
            orderBy:{createdAt:'desc'}
        });
         console.log('Raw contacts from DB:', JSON.stringify(contacts));
        return contacts.map(contact=>{
            const otherUser=contact.user1Id===userId?contact.user2:contact.user1;
               return {
        contactId: contact.id,
        user: otherUser,
        createdAt: contact.createdAt,
      };
        })
    }

    async getMessages(userId:string,contactId:string,cursor?:string,limit=50){
        const contact=await this.prisma.contact.findUnique({
            where:{id:contactId}
        });
        if (!contact) throw new ForbiddenException('Contact not found');
       if (contact.user1Id !== userId && contact.user2Id !== userId) {
      throw new ForbiddenException('Not your contact');
    }
    const messages=await this.prisma.message.findMany({
        where:{contactId},
        orderBy:{createdAt:'desc'},
        take:limit,
        ...(cursor?{cursor:{id:cursor},skip:1}:{}),
        include:{
            sender:{select:{id:true,displayName:true}}
        },
    });
    return messages.reverse();
    }

    async saveMessage(senderId:string,contactId:string,text:string){
          const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) throw new ForbiddenException('Contact not found');
    if (contact.user1Id !== senderId && contact.user2Id !== senderId) {
      throw new ForbiddenException('Not your contact');
    }
    const message=await this.prisma.message.create({
        data:{
            contactId,
            senderId,
            text,
        },
         include: {
        sender: { select: { id: true, displayName: true } },
      },
    });
    return message;
    }
    
    async getOtherUserId(contactId:string,myId:string):Promise<string | null>{
        const contact=await this.prisma.contact.findUnique({
            where:{id:contactId}
        });
        if (!contact) return null;
        return contact.user1Id===myId?contact.user2Id:contact.user1Id;
    }
}
