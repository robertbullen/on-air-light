#include <math.h>

float easeBinary(float t)
{
    return round(t);
}

float easeSine(float t)
{
    return sin(M_PI * t);
}

float easeQuad(float t)
{
    return t * t * t * t;
}

float easeQuint(float t)
{
    return t * t * t * t * t;
}
