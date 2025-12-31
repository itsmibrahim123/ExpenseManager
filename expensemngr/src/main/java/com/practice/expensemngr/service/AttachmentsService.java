package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.AttachmentsDTO;
import com.practice.expensemngr.entity.Attachments;
import com.practice.expensemngr.repository.AttachmentsRepository;
import com.practice.expensemngr.vo.AttachmentsQueryVO;
import com.practice.expensemngr.vo.AttachmentsUpdateVO;
import com.practice.expensemngr.vo.AttachmentsVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class AttachmentsService {

    @Autowired
    private AttachmentsRepository attachmentsRepository;

    public Long save(AttachmentsVO vO) {
        Attachments bean = new Attachments();
        BeanUtils.copyProperties(vO, bean);
        bean = attachmentsRepository.save(bean);
        return bean.getId();
    }

    public void delete(Long id) {
        attachmentsRepository.deleteById(id);
    }

    public void update(Long id, AttachmentsUpdateVO vO) {
        Attachments bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        attachmentsRepository.save(bean);
    }

    public AttachmentsDTO getById(Long id) {
        Attachments original = requireOne(id);
        return toDTO(original);
    }

    public Page<AttachmentsDTO> query(AttachmentsQueryVO vO) {
        throw new UnsupportedOperationException();
    }

    private AttachmentsDTO toDTO(Attachments original) {
        AttachmentsDTO bean = new AttachmentsDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private Attachments requireOne(Long id) {
        return attachmentsRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}
