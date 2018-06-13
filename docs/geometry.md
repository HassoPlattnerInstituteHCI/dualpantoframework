# Geometry

This contains the API documentation af the geometry helper classes.

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Vector][1]
    -   [dot][2]
    -   [scale][3]
    -   [scaled][4]
    -   [add][5]
    -   [sum][6]
    -   [subtract][7]
    -   [difference][8]
    -   [length][9]
    -   [polarAngle][10]
    -   [normalized][11]
    -   [product][12]

## Vector

Class for Class for defining Panto Vecotrs with x, y cords and r as roation

**Parameters**

-   `x` **[number][13]** x coordinate (optional, default `0`)
-   `y` **[number][13]** y coordinate (optional, default `0`)
-   `r` **[number][13]** rotation in radian (optional, default `0`)

### dot

Calculates and returns the dot product with another vector.

**Parameters**

-   `vector` **[Vector][14]** vector to operate with

Returns **[number][13]** The calculated result

### scale

Scales this Vector with a factor.

**Parameters**

-   `factor` **[number][13]** factor to scale vector

Returns **[Vector][14]** The scaled Vector

### scaled

Creates a scaled vector.

**Parameters**

-   `factor` **[number][13]** factor to scale vector

Returns **[Vector][14]** The new scaled Vector

### add

Adds a vector to this vector.

**Parameters**

-   `vector` **[Vector][14]** vector to operate with

Returns **[Vector][14]** The summed up vector

### sum

Returns the sum of this vector and another vector.

**Parameters**

-   `vector` **[Vector][14]** vector to operate with

Returns **[Vector][14]** The new summed up vector

### subtract

Subtracts a vector from this vector.

**Parameters**

-   `vector` **[Vector][14]** vector to operate with

Returns **[Vector][14]** The reduced vector

### difference

Returns the difference of this vector and another vector.

**Parameters**

-   `vector` **[Vector][14]** vector to operate with

Returns **[Vector][14]** The difference vector

### length

Calculates the length of the vector

Returns **[number][13]** length of vector

### polarAngle

Calculates the polar angle of the vector
Right-hand coordinate system:
Positive rotation => Counter Clock Wise
Positive X-Axis is 0

Returns **[number][13]** polar angle of vector

### normalized

Normalizes the vector

Returns **[Vector][14]** this normalized vector

### product

Creates a transformed vector by multiplication with a matrix

**Parameters**

-   `matrix` **[Array][15]** matrix to operate with

Returns **[Vector][14]** The transfromed vector

[1]: #vector

[2]: #dot

[3]: #scale

[4]: #scaled

[5]: #add

[6]: #sum

[7]: #subtract

[8]: #difference

[9]: #length

[10]: #polarangle

[11]: #normalized

[12]: #product

[13]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[14]: #vector

[15]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array