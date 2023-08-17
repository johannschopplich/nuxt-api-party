<script setup lang="ts">
import type { components } from '#nuxt-api-party/petStore'

const availableStatus = ['pending', 'sold'] as const
const status = ref<'pending' | 'sold' >()

const { data, error } = usePetStoreData('pet/findByStatus', {
  query: computed(() => ({
    status: status.value ?? 'pending',
  })),
})

// eslint-disable-next-line no-console
watch(error, value => console.log(value))

const petData = ref<components['schemas']['Pet']>()

async function fetchPetData(petId: number) {
  try {
    petData.value = await $petStore('pet/{petId}', {
      method: 'GET',
      pathParams: {
        petId,
      },
    })
  }
  catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div>
    <h2>usePetStoreData</h2>
    <p>Status: {{ status }}</p>
    <p>
      <button @click="status = availableStatus[status ? availableStatus.indexOf(status) + 1 % 3 : 0]">
        Next status
      </button>
    </p>
    <p>
      <button v-for="pet in data" :key="pet.id" @click="fetchPetData(pet.id!)">
        {{ pet.name }}
      </button>
    </p>
    <pre>{{ JSON.stringify(petData, undefined, 2) }}</pre>
  </div>
</template>
