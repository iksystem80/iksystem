<template>
    <div class="app-container">
        <!-- =========================================
         MAIN CONTENT
    ========================================== -->
        <main class="content">
            <!-- =======================================
             PROFILE HERO
        ======================================== -->
            <section class="profile-card">
                <div class="profile-photo-area">
                    <div v-if="!cameraStart" class="photo-wrapper">
                        <img :src="customer.avatar" class="customer-photo" alt="Customer photo" />
                    </div>
                    <CameraApp v-if="cameraStart" ref="cameraRef" @captured="handleCapturedImage" shape="rectangle" />
                </div>
                <div class="profile-main">
                    <div class="profile-heading">
                        <div>
                            <h2>
                                {{ customer.fullname }}
                            </h2>
                            <p>
                                {{ customer.phone }}
                            </p>
                        </div>
                    </div>
                    <div style="margin-top:25px">
                        <el-form ref="pointFormRef" :model="pointForm" :rules="formRules" label-position="top" class="point-form">
                            <el-row :gutter="16">
                                <!-- Machine Number -->
                                <el-col :xs="24" :sm="12">
                                    <el-form-item label="Machine #" prop="machinenumber">
                                        <el-input v-model="pointForm.machinenumber" placeholder="Enter machine number" clearable @change="getmachine">
                                            <template #prefix>
                                                <el-icon>
                                                    <Monitor />
                                                </el-icon>
                                            </template>
                                        </el-input>
                                    </el-form-item>
                                </el-col>

                                <!-- Points -->
                                <el-col :xs="24"
                                        :sm="12">
                                    <el-form-item label="Points"
                                                  prop="points">
                                        <el-input v-model="pointForm.points"
                                                  placeholder="Enter points"
                                                  clearable>
                                            <template #prefix>
                                                <el-icon>
                                                    <Coin />
                                                </el-icon>
                                            </template>
                                        </el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-form>
                    </div>

                </div>
            </section>


            <!-- =======================================
         VIP STATUS  v-if="customer.isVip"
        ======================================== -->
            <section class="vip-status"
                     :class="{ verified: photoTaken }">

                <div class="status-icon">
                    <el-icon v-if="photoTaken">
                        <CircleCheck />
                    </el-icon>

                    <el-icon v-else>
                        <WarningFilled />
                    </el-icon>

                </div>
                <div class="status-content">
                    <h3>{{photoTaken ? 'Photo verification complete' : 'Photo verification required'}}</h3>

                    <p v-if="!photoTaken">
                        This VIP customer must have a current photo
                        before a machine can be assigned.
                    </p>
                    <p v-else>
                        Customer photo has been successfully verified.
                        You can now assign a machine.
                        Veiw Photo
                    </p>

                </div>

                <el-button v-if="!photoTaken" type="warning" @click="takePhoto">
                    <!--<el-icon><Camera /></el-icon>-->
                    Take Customer Photo
                </el-button>
                <el-image class="img-circle" v-if="photoTaken"
                          :src="tempImage"
                          :preview-src-list="[tempImage]"
                          fit="cover"
                          preview-teleported />
            </section>

            <!-- =======================================
             TWO COLUMN AREA
        ======================================== -->
            <div class="dashboard-grid">
                <!-- LEFT -->
                <div class="left-column">
                    <!-- COMMENTS -->
                    <section class="section-card1">
                        <el-input v-model="comments"
                                  type="textarea"
                                  :rows="4"
                                  resize="none"
                                  placeholder="Add notes about this customer..."
                                  class="comments" />

                    </section>

                    <!-- QUICK INFO -->
                    <section class="quick-card">
                        <div class="quick-header">
                            <span>Customer Status</span>
                            <span class="online-dot"></span>
                        </div>

                        <div class="quick-status">
                            Active
                        </div>

                        <p>
                            Customer is eligible for machine
                            assignment after photo verification.
                        </p>

                    </section>
                </div>

                <!-- VISITS -->
                <section class="section-card">

                    <div class="section-header">

                        <div>
                            <span class="section-kicker">
                                ACTIVITY
                            </span>

                            <!--<h3>
                            Customer History
                        </h3>-->
                        </div>

                        <el-icon class="history-icon">
                            <Clock />
                        </el-icon>

                    </div>


                    <div class="stats-list">

                        <div class="history-item">

                            <div class="history-icon-box purple">
                                <el-icon>
                                    <Calendar />
                                </el-icon>
                            </div>

                            <div>
                                <span>
                                    Total Visits
                                </span>

                                <strong>
                                    {{ customer.totalVisits }}
                                </strong>
                            </div>

                        </div>


                        <div class="history-item">

                            <div class="history-icon-box blue">
                                <el-icon>
                                    <Timer />
                                </el-icon>
                            </div>

                            <div>
                                <span>
                                    Last Visit
                                </span>

                                <strong>
                                    {{ customer.lastVisit }}
                                </strong>
                            </div>

                        </div>


                        <div class="history-item">

                            <div class="history-icon-box green">
                                <el-icon>
                                    <User />
                                </el-icon>
                            </div>

                            <div>
                                <span>
                                    Registered
                                </span>

                                <strong>
                                    {{ customer.registrationDate }}
                                </strong>
                            </div>

                        </div>

                    </div>

                </section>

            </div>

        </main>


        <!-- =========================================
         MOBILE / BOTTOM ACTION BAR
    ========================================== -->
        <footer class="action-bar">

            <div class="action-summary">
                <span>Machine</span>
                <strong>
                    {{ pointForm.machinenumber ? pointForm.machinenumber : 'Not selected' }}
                    {{ pointForm.machinid }}
                </strong>
            </div>
            <div class="action-summary">
                <span>Points</span>
                <strong>
                    {{ pointForm.points}}
                </strong>
            </div>
            <div class="action-buttons">

                <el-button size="large"
                           @click="closePage">
                    Cancel
                </el-button>

                <el-button type="primary"
                           size="large"
                           :loading="loading"
                           :disabled="!photoTaken"
                           @click="assignMachine">
                    <el-icon>
                        <Check />
                    </el-icon>
                    Assign Machine
                </el-button>

            </div>

        </footer>

    </div>
</template>


<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { useUserStore } from '@/store/modules/user'
    import { useAppStore } from '@/store/modules/app'
    import CameraApp from '@/components/Camera'
import { getmachinebynumber } from '@/api/machine'
import { saveassignmachine  } from '@/api/customer'

    const userStore = useUserStore()
    const appStore = useAppStore()
    const device = computed(() => appStore.device)
    const locationid = userStore.locationId

    const vipThreshold = 10
    const comments = ref('')
    const photoTaken = ref(false)
    const cameraStart = ref(false)
    const cameraRef = ref(null)
    
const defaultForm = {
        checkinid:null,
        customerid: null,
        machineid: null,
        machinenumber: null,
        points: null,
        assignedby: userStore.userId,
        locationid: userStore.locationId
    }
    const pointForm = reactive({
        ...defaultForm
    })
    const pointFormRef = ref(null)
    const capturedImage = ref(null)
    const tempImage = ref(null)
const loading = ref(false)
    const emit = defineEmits(['closed'])

const formRules = {
    machinenumber: [
        { required: true, message: 'machine number is required', trigger: 'blur' }
    ],
    points: [
        { required: true, message: 'point is required', trigger: 'blur' }
    ]
}
    /* =========================================
       Customer
    ========================================= */

const props = defineProps({
    customer: {
        type: Object,
        required: true
    }
})

    function handleCapturedImage(image) {
        capturedImage.value = image

        if (tempImage.value) {
            URL.revokeObjectURL(tempImage.value)
        }
        tempImage.value = URL.createObjectURL(image)

        cameraStart.value = false
        photoTaken.value = true
    }

    /* =========================================
       Computed
    ========================================= */

    // const machineLocked = computed(() => {
    //     return customer.value.isVip &&
    //         !photoTaken.value
    // })


    // const canSetMachine = computed(() => {

    //     if (!selectedMachine.value) {
    //         return false
    //     }

    //     if (
    //         customer.value.isVip &&
    //         !photoTaken.value
    //     ) {
    //         return false
    //     }

    //     return true
    // })


    /* =========================================
       Methods
    ========================================= */

const takePhoto = async () => {
    cameraStart.value = true
    await nextTick()
    cameraRef.value?.startCamera()
}

async function getmachine() {
    console.log('locaton id: ' + locationid)
    //Save new session
    if (!pointForm.machinenumber) {
       pointForm.machineid = 0
        return;
    }
    const response = await getmachinebynumber(pointForm.machinenumber, locationid)
    console.log(response)

    if (!response) {
        pointForm.machineid = 0
        throw new Error('Error while saving new reading')
    }
    if (response?.data?.id) {
        pointForm.machineid = response.data.id
        //alert('point machine id:' + pointForm.machineid)
    }
    else {
        console.log("else")
        ElMessage({ message: 'machine not found', type: 'error' })
        pointForm.machineid = 0
    }
}

async function assignMachine() {
    if (!pointFormRef.value) {
        return
    }

    try {
        // Validate form
        const valid = await pointFormRef.value.validate()

        if (!valid) {
            return
        }

        // Check captured image
        if (!capturedImage.value) {
            ElMessage.warning('Please capture a customer photo with machine.')
            return
        }

        loading.value = true

        /**
         * Create a new File with customer name
         */
        const fileName =`${pointForm.fullname}${pointForm.machineid}.png`

        const imageFile = new File(
            [capturedImage.value],
            fileName,
            {
                type: capturedImage.value.type || 'image/png'
            }
        )

        pointForm.locationid = userStore.locationId
        pointForm.customerid = props.customer.id
        pointForm.checkinid = props.customer.checkinid
        /**
         * Create FormData
         */
        const formData = new FormData()

        formData.append('image', imageFile)

        formData.append('customer', JSON.stringify(pointForm))

        /**
         * Send request
         */
        const response = await saveassignmachine(formData)

        if (!response) {
            throw new Error('Upload failed')
        }

        console.log('Server response:', response)

        ElMessage({
            message: 'Machine assigned successfully.',
            type: 'success'
        })

        // Reset form after successful submission
        cameraRef.value?.stopCamera()
        emit('closed')

    } catch (error) {
        console.error('Error uploading file:', error)

        ElMessage({
            message: error.message || 'Error uploading customer.',
            type: 'error'
        })
    } finally {
        loading.value = false
    }

    
}    
 

const closePage = () => {
        emit('closed')
        cameraRef.value?.stopCamera()
    }

    onBeforeUnmount(() => {
        emit('closed')
        cameraRef.value?.stopCamera()
     });
</script>




