#include <Arduino.h>
// #include "psramAllocator.hpp"

//new.cpp
#include <cstdlib>
#include <new>

void *operator new(size_t size) noexcept { return ps_malloc(size); }
void operator delete(void *p) noexcept { free(p); }
void *operator new[](size_t size) noexcept { return operator new(size); }
void operator delete[](void *p) noexcept { operator delete(p); }
void *operator new(size_t size, std::nothrow_t) noexcept { return operator new(size); }
void operator delete(void *p, std::nothrow_t) noexcept { operator delete(p); }
void *operator new[](size_t size, std::nothrow_t) noexcept { return operator new(size); }
void operator delete[](void *p, std::nothrow_t) noexcept { operator delete(p); }


void logMemory() {
  log_d("Used PSRAM: %d", ESP.getPsramSize() - ESP.getFreePsram());
  log_d("Free PSRAM: %d", ESP.getFreePsram());
  log_d("Free heap: %i of %i (%.3f %%).", ESP.getFreeHeap(), ESP.getHeapSize(), 100*ESP.getFreeHeap()/(float)ESP.getHeapSize());
}

void setup() {
  psramInit();
  Serial.begin(9600);
  bool ramFound = psramInit();
  log_d("Ram found %d", ramFound);
  logMemory();
  byte* psdRamBuffer = (byte*)ps_malloc(500000);
  logMemory();
  free(psdRamBuffer);
  logMemory();
  int arr[] = {2,5,8,11,14};
  // std::vector<int,PSRAMAllocator<int>> m_cells(arr, arr+5);  
  std::vector<int> m_cells(arr, arr+5); 
  logMemory();
  m_cells.push_back(10);
  logMemory();
  std::vector<int> m_cells1; 
  for (int i = 0;i<100000;i++){
    m_cells1.push_back(i);
  }
  logMemory();
  m_cells.reserve(100000); 
  m_cells.push_back(20);
  logMemory();

  logMemory();
}

void loop() {
}
