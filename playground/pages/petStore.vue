<script setup lang="ts">
import type { components } from '#nuxt-api-party/petStore'

const statuses = [
  'pending',
  'sold',
] as const

const status = ref<'pending' | 'sold'>()

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
      method: 'get',
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
    <p>Status: {{ status }}</p>
    <button @click="status = statuses[status ? statuses.indexOf(status) + 1 % 3 : 0]">
      Next status
    </button>
    <div>
      <button v-for="pet in data" :key="pet.id" @click="fetchPetData(pet.id!)">
        {{ pet.name }}
      </button>
    </div>
    <div><pre>{{ petData }}</pre></div>
  </div>
</template>
