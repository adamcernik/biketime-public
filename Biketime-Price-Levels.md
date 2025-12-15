This is an example of how we calculate the 4 price levels A-D

The conversion rate can change but now we work with 27 CZK per EUR (we have an input field for this in the admin panel)

Here is the math to the levels:

**EUR price to CZK price**
We calculate the price of the product in CZK from the UVP_PL column in the database by multiplying it by the conversion rate (27 in this case, but can be changed by the user in the admin panel)

**CZK price to price without VAT**
The calculated price gets counted to the price without VAT (21% VAT)

**Level A**
CZK price without VAT / 1.3

**Level B**
CZK price without VAT / 1.35

**Level C**
CZK price without VAT / 1.4

**Level D**
CZK price without VAT / 1.45

Important Note for ADMIN: the levels are editable in the admin panel!

Lets design this system and test it with a few products