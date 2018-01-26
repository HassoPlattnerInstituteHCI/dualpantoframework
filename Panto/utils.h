float clamp(float value, float min, float max) {
  return fmin(fmax(value, min), max);
}

union Number32 {
  float f;
  int32_t i;
  Number32(float x) :f(x) {}
  Number32(int32_t x) :i(x) {}
};

unsigned char inChecksum, outChecksum;

void sendNumber32(union Number32 value) {
  unsigned char buffer[4];
  for(unsigned char i = 0; i < sizeof(buffer); ++i) {
    buffer[i] = (unsigned char)(value.i>>(i*8));
    outChecksum ^= buffer[i];
  }
  SerialUSB.write(buffer, sizeof(buffer));
}

union Number32 receiveNumber32() {
  unsigned char buffer[4];
  SerialUSB.readBytes(buffer, sizeof(buffer));
  for(unsigned char i = 0; i < sizeof(buffer); ++i)
    inChecksum ^= buffer[i];
  return (int32_t)(buffer[0] | (buffer[1]<<8) | (buffer[2]<<16) | (buffer[3]<<24));
}

unsigned char receiveInt8() {
  unsigned char result = SerialUSB.read();
  inChecksum ^= result;
  return result;
}

struct Vector2D {
  float x, y;

  Vector2D() {}
  Vector2D(float _x, float _y) :x(_x), y(_y) {}

  static Vector2D fromPolar(float angle, float length) {
    return Vector2D(cos(angle)*length, sin(angle)*length);
  }

  float length() {
    return sqrt(x*x+y*y);
  }

  float angle() {
    return atan2(y, x);
  }

  Vector2D operator+(const Vector2D& other) {
    return Vector2D(x+other.x, y+other.y);
  }

  Vector2D operator-(const Vector2D& other) {
    return Vector2D(x-other.x, y-other.y);
  }
};
