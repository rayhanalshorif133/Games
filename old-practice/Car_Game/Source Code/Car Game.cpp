#include <graphics.h>
#include <stdlib.h>
#include <stdio.h>
#include <conio.h>
#include<DOS.h>
#include "number.h"



void End()
{  int gd = DETECT, gm;

   initgraph(&gd, &gm, "C:\\TC\\BGI");


setcolor(CYAN);
rectangle(0,0,1000,1000);
setfillstyle(1,CYAN);
floodfill(1,1,CYAN);



setcolor(WHITE);
rectangle(200,-1,400,500);
setfillstyle(1,8);
floodfill(201,0,WHITE);

settextstyle(10,0,4);
outtextxy(215,300,"Game Over");


Beep(1300,1000);



getch();
closegraph();

}
void Crash1()
{
outtextxy(115,300,"CRASH 1");

}
void Crash2()
{
outtextxy(115,300,"CRASH 2");

}
void Crash3()
{
outtextxy(115,300,"CRASH 3");


}







int main()
{
   int gd = DETECT, gm;

   initgraph(&gd, &gm, "C:\\TC\\BGI");
int Lode=-1;


for(int n=0;n<550;n+=110)
{
settextstyle(10,0,2);
outtextxy(45+n,0,"CAR GAME");
delay(50);

}
for(int n=0;n<=425;n+=25)
{
settextstyle(10,0,2);
outtextxy(485,0+n,"CAR GAME");
delay(50);

}
for(int n=0;n<=440;n+=110)
{
settextstyle(10,0,2);
outtextxy(485-n,425,"CAR GAME");
delay(50);

}
for(int n=0;n<=425;n+=25)
{
settextstyle(10,0,2);
outtextxy(45,425-n,"CAR GAME");
delay(50);
}
for(int n=0;n<=330;n+=110)
{
settextstyle(10,0,2);
outtextxy(45+n,25,"CAR GAME");
delay(50);
}
for(int n=0;n<=375;n+=25)
{
settextstyle(10,0,2);
outtextxy(375,25+n,"CAR GAME");
delay(50);
}
for(int n=0;n<=220;n+=110)
{
settextstyle(10,0,2);
outtextxy(375-n,400,"CAR GAME");
delay(50);
}
for(int n=0;n<=350;n+=25)
{
settextstyle(10,0,2);
outtextxy(155,400-n,"CAR GAME");
delay(50);

}
for(int n=0;n<=110;n+=110)
{
settextstyle(10,0,2);
outtextxy(155+n,50,"CAR GAME");
delay(50);

}
for(int n=0;n<=300;n+=25)
{
settextstyle(10,0,2);
outtextxy(265,50+n,"CAR GAME");
delay(50);

}





setcolor(CYAN);
rectangle(0,0,1000,1000);
setfillstyle(1,CYAN);
floodfill(1,1,CYAN);


setcolor(WHITE);
rectangle(200,-1,400,500);
setfillstyle(1,8);
floodfill(201,0,WHITE);


settextstyle(10,0,5);
outtextxy(240,300,"Start");

delay(2000);
settextstyle(10,0,2);
outtextxy(240,340,"Press Any key To Start The Game.......");
getch();


//Loading parts

setcolor(GREEN);
rectangle(0,0,1000,1000);
setfillstyle(1,GREEN);
floodfill(1,1,GREEN);
setcolor(BLUE);

rectangle(150,412,450,400);
setcolor(8);

for(int i=0;i<=300;i++){


if(i%3==0)
{
    Lode++;
}
setcolor(WHITE);
line(150+i,400,150+i,412);
//setcolor(BLACK);
settextstyle(9,0,1);
outtextxy(270,420,"% Loading...");
pointpoint(Lode,230,420);
if(i==140)
{delay(60);}
else if(i==160)
{delay(10);}
else if(i==200)
{delay(300);}
else if(i==205)
{delay(10);}

else
{delay(20);}
}









int page=0,t_y=-300;

int c_x=0,M_speed=5,left=-20,del=0,pointcount=0;

int tt=10;
int crash=0,Bonus_point=0;


int oc_y=0;
int oc_y1=0;
int oc_y2=0;
int oc_y3=0,oc_y4=0;

while(1)
{


    crash=crash;

 setactivepage(page);
 setvisualpage(1-page);
 cleardevice();



 setcolor(CYAN);
rectangle(0,0,1000,1000);
setfillstyle(1,CYAN);
floodfill(1,1,CYAN);


setcolor(WHITE);
rectangle(200,-1,400,500);
setfillstyle(1,8);
floodfill(201,0,WHITE);


//line in road

for(int i=0;i<450;i+=105)
{

 rectangle(290,10+i+t_y,310,50+i+t_y);
 setfillstyle(1,WHITE);
floodfill(291,11+i+t_y,WHITE);



}
t_y+=15;
if(t_y>500)
    t_y=-500;




/////Pointting parts///////////////////////////////////////

if(crash==0)
{circle(250,200+Bonus_point,15);
floodfill(251,201+Bonus_point,WHITE);
Bonus_point+=30;
if(Bonus_point>2000)
    Bonus_point=-2000;
}
if(crash==-1)
{circle(250,200+Bonus_point,15);
floodfill(251,201+Bonus_point,WHITE);
Bonus_point+=30;
if(Bonus_point>2000)
    Bonus_point=-2000;
}
if(crash==1)
{circle(250,200+Bonus_point,15);
floodfill(251,201+Bonus_point,WHITE);
Bonus_point+=30;
if(Bonus_point>2000)
    Bonus_point=-2000;
}
if(crash==2)
{circle(250,200+Bonus_point,15);
floodfill(251,201+Bonus_point,WHITE);
Bonus_point+=30;
if(Bonus_point>2000)
    Bonus_point=-2000;
}




if(Bonus_point==250 && (c_x==-55 || c_x==-60 || c_x==-65 || c_x==-70 || c_x==-75))
{
    --crash;
    Beep(1200,100);

}




//for life and point
settextstyle(10,0,2);
outtextxy(10,10,"Life:");
//Drowing circle
if(crash==-1)
{setfillstyle(1,WHITE);
circle(90,20,6);
floodfill(91,21,WHITE);
circle(110,20,6);
floodfill(111,21,WHITE);
circle(130,20,6);
floodfill(131,21,WHITE);
circle(155,20,6);
floodfill(156,21,WHITE);
crash=crash;

outtextxy(425,315,"Life is Full");
outtextxy(425,340,"Don't Touch");

}



if(crash==0)
{setfillstyle(1,WHITE);
circle(90,20,6);
floodfill(91,21,WHITE);
circle(110,20,6);
floodfill(111,21,WHITE);
circle(130,20,6);
floodfill(131,21,WHITE);
}
if(crash==1)
 {setfillstyle(1,WHITE);
circle(90,20,6);
floodfill(91,21,WHITE);
circle(110,20,6);
floodfill(111,21,WHITE);
Crash1();
}
if(crash==2)
 {setfillstyle(1,WHITE);
circle(90,20,6);
floodfill(91,21,WHITE);
Crash2();
}




//for point count logics
if(oc_y==-50)
{pointcount++;}
if(oc_y1==-50)
{pointcount++;}
if(oc_y3==50)
 {pointcount++;}
 if(oc_y4==-50)
 {pointcount++;}
 outtextxy(10,40,"Points:");
pointpoint(pointcount,100,40);

if(crash==3)
{
  Crash3();
  End();
}




//////////////////////////////////////////////////////////////////////////////////////////////////
//car

setcolor(BLACK);
setfillstyle(1,RED);
rectangle(300+c_x,400,340+c_x,460);
floodfill(301+c_x,410,BLACK);

//Font
setfillstyle(1,BROWN);
rectangle(305+c_x,385,335+c_x,400);
floodfill(306+c_x,386,BLACK);


//MOOD

setfillstyle(1,GREEN);
rectangle(305+c_x,405,335+c_x,455);
floodfill(306+c_x,406,BLACK);

//whiles

setfillstyle(1,BLACK);
pieslice(305+c_x,392,90,270,6);
pieslice(337+c_x,392,270,90,5);




/////////////////////////////////////////////////////////////////////////////

//Oponent Car
rectangle(300,400+oc_y,340,460+oc_y);
floodfill(301,401+oc_y,BLACK);
//Font
setfillstyle(1,BROWN);
rectangle(305,460+oc_y,335,475+oc_y);
floodfill(306,461+oc_y,BLACK);

oc_y+=15;
if(oc_y>500)
    oc_y=-500;




//cur crash by oponent car 1.........

if(oc_y==-50 && (c_x==0 || c_x==5 || c_x==10 || c_x==15 || c_x==20 || c_x==25 || c_x==30 || c_x==35))
{ crash++;
Beep(1200,100);

}

if(oc_y==-50 && (c_x==-5 || c_x==-10 || c_x==-15 || c_x==-20 || c_x==-25 || c_x==-30 || c_x==-35))
{
    crash++;
    Beep(1200,100);


}



//Oponent Car   2222222222222222
rectangle(250,400+oc_y1,290,460+oc_y1);
floodfill(251,401+tt+oc_y1,BLACK);
//Font
setfillstyle(1,BLUE);
rectangle(255,460+oc_y1,285,475+oc_y1);
floodfill(256,461+oc_y1,BLACK);

oc_y1+=15;
if(oc_y1>800)
    oc_y1=-800;




//cur crash by oponent car 2222222222222.........

if(oc_y1==-50 && (c_x==-15 || c_x==-20 || c_x==-25 || c_x==-30 || c_x==-35 || c_x==-40 || c_x==-45 || c_x==-50 || c_x==-55 || c_x==-60 || c_x==-65 || c_x==-70 || c_x==-75 || c_x==-80 || c_x==-85))
{crash++;
Beep(1200,100);}


//printf("\noc_y1=%d",oc_y1);
//
//delay(400);



//Oponent Car 333333333333333333
int t=50;
rectangle(300+t,400+oc_y3,340+t,460+oc_y3);
floodfill(301+t,401+oc_y3,BLACK);

//Font
setfillstyle(1,BROWN);
rectangle(305+t,460+oc_y3,335+t,475+oc_y3);
floodfill(306+t,461+oc_y3,BLACK);

oc_y3+=50;
if(oc_y3>1500)
    oc_y3=-1500;


//Crash Oponent Car 3333333
if(oc_y3==50 && (c_x==15 || c_x==20 || c_x==25 || c_x==30 || c_x==35 || c_x==40 || c_x==45 || c_x==50 || c_x==55))
{crash++;

Beep(1200,100);}











//Oponent Car    44444444444444
{int t1=-80;
rectangle(300+t1,400+oc_y4,340+t1,460+oc_y4);
floodfill(301+t1,401+oc_y4,BLACK);

//Font
setfillstyle(1,rand()+1);
rectangle(305+t1,460+oc_y4,335+t1,475+oc_y4);
floodfill(306+t1,461+oc_y4,BLACK);

oc_y4+=15;
if(oc_y4>2000)
    oc_y4=-2000;
}

//Crash Oponent Car 444444444
if(oc_y4==-50 && (c_x==-50 || c_x==-55 || c_x==-60 || c_x==-65 || c_x==-70 || c_x==-75 || c_x==-80 || c_x==-85 || c_x==-90 || c_x==-95))
{
crash++;
Beep(1200,100);
}








if(GetAsyncKeyState(VK_LEFT))
    c_x-=M_speed;
else if(GetAsyncKeyState(VK_RIGHT))
    c_x+=M_speed;





if(c_x==60 || c_x==-105)
{crash++;

Beep(1200,100);}




//printf("\nC_x=%d",c_x);



page=1-page;



if(oc_y==-50)
{

del++;

}

if(del==30)
{

delay(20);
}
else if(del==25)
{
delay(25);
}
else if(del==20)
{

delay(30);
}
else if(del==15)
{

delay(40);
}
else if(del==10)
{

delay(60);
}
else if(del==5)
{

delay(80);
}
else
{

delay(100);
}






}


  getch();
  closegraph();
}


