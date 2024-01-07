<script setup lang="ts">
import type { NuxtError } from '#app'
import type { components } from '#nuxt-api-party/petStore'

type Pet = components['schemas']['Pet']

const availableStatus = ['pending', 'sold'] as const
const status = ref<'pending' | 'sold'>()

const { data: user, execute } = usePetStoreData('user/{username}', {
  pathParams: { username: 'user1' },
  cache: true,
})

const { data, error } = usePetStoreData('pet/findByStatus', {
  query: computed(() => ({
    status: status.value ?? 'pending',
  })),
  transform(response) {
    return response.map(({ id, name }) => ({
      id,
      name,
    }))
  },
})

watch(error, value => console.error(value))

async function updateUser() {
  try {
    // Will error because of authentication
    await $petStore('user/{username}', {
      method: 'PUT',
      pathParams: { username: 'user1' },
      body: {
        firstName: 'first name 2',
      },
      cache: false,
    })
    await execute()
  }
  catch (error) {
    console.error(error)
  }
}

const petData = ref<Pet | undefined>()

async function fetchPetData(petId: number) {
  try {
    petData.value = await $petStore('pet/{petId}', {
      method: 'GET',
      pathParams: {
        petId,
      },
    })
  }
  catch (error) {
    console.error(error)
  }
}

const createdPet = ref<Pet>()

async function abandonGarfield() {
  // Put the fat lazy cat up for adoption
  try {
    createdPet.value = await $petStore('pet', {
      method: 'POST',
      body: {
        id: 123,
        name: 'Garfield',
        status: 'available',
        photoUrls: ['https://example.com/garfield.png'],
        category: { id: 1, name: 'Cats' },
        tags: [
          { id: 10, name: 'lazy' },
          { id: 20, name: 'fat' },
        ],
      } satisfies Pet,
    })
  }
  catch (error) {
    console.error(error as NuxtError)
    // Log the API response body
    console.error('Response body:', (error as NuxtError).data)
  }
}
</script>

<template>
  <div>
    <h2>User</h2>
    <p v-if="user" class="name">
      {{ user.firstName }} {{ user.lastName }}
      <button @click="updateUser">
        Update
      </button>
    </p>
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
    <p>
      <button @click="abandonGarfield">
        Put up Garfield
      </button>
    </p>
    <p v-if="createdPet">
      Garfield can now be adopted.
      <pre>{{ createdPet }}</pre>
    </p>
  </div>
</template>

<style scoped>
.name {
  text-transform: capitalize;
}
</style>
